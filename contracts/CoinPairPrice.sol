// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {ICoinPairPrice} from "@moc/shared/contracts/ICoinPairPrice.sol";
import {IOracleManager} from "@moc/shared/contracts/ICoinPairPrice.sol";
import {IPriceProvider} from "@moc/shared/contracts/IPriceProvider.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {AddressSetLib} from "@moc/shared/contracts/lib/AddressSetLib.sol";
import {IPriceProviderRegisterEntry} from "@moc/shared/contracts/IPriceProviderRegisterEntry.sol";
import {RoundInfoLib} from "./libs/RoundInfoLib.sol";
import {SubscribedOraclesLib} from "./libs/SubscribedOraclesLib.sol";
import {OracleManager} from "./OracleManager.sol";
import {IterableWhitelistLib} from "./libs/IterableWhitelistLib.sol";
import {CoinPairPriceStorage} from "./CoinPairPriceStorage.sol";
import {RegistryConstantsLib} from "@moc/shared/contracts/RegistryConstants.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is
    CoinPairPriceStorage,
    IPriceProvider,
    IPriceProviderRegisterEntry,
    ICoinPairPrice
{
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;
    using SafeMath for uint256;

    event OracleRewardTransfer(
        uint256 roundNumber,
        address oracleOwnerAddress,
        address toOwnerAddress,
        uint256 amount
    );
    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    event EmergencyPricePublished(
        address sender,
        uint256 price,
        address votedOracle,
        uint256 blockNumber
    );
    event NewRound(
        address caller,
        uint256 number,
        uint256 totalPoints,
        uint256 startBlock,
        uint256 lockPeriodTimestamp,
        address[] selectedOracles
    );

    /// @notice Construct a new contract
    /// @param _governor The governor address.
    /// @param _wlist List of whitelisted contracts (those that can get the price).
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _minOraclesPerRound The minimum count of oracles selected to participate each round
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _maxSubscribedOraclesPerRound The maximum count of subscribed oracles
    /// @param _roundLockPeriod The minimum time span for each round before a new one can be started, in secs.
    /// @param _validPricePeriodInBlocks The time span for which the last published price is valid.
    /// @param _emergencyPublishingPeriodInBlocks The number of blocks that must pass after a publication after which
    //          an emergency publishing must be enabled
    /// @param _bootstrapPrice A price to be set as a bootstraping value for this block
    /// @param _oracleManager The contract of the oracle manager.
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _maxSubscribedOraclesPerRound,
        uint256 _roundLockPeriod,
        uint256 _validPricePeriodInBlocks,
        uint256 _emergencyPublishingPeriodInBlocks,
        uint256 _bootstrapPrice,
        OracleManager _oracleManager,
        IRegistry _registry
    ) external initializer {
        require(_wlist.length != 0, "Whitelist must have at least one element");
        require(_coinPair != bytes32(0), "Coin pair must be valid");
        require(
            _tokenAddress != address(0),
            "The MOC token address must be provided in constructor"
        );
        require(
            _validPricePeriodInBlocks > 0,
            "The valid price period must be positive and non zero"
        );
        require(
            _emergencyPublishingPeriodInBlocks > 0,
            "The emergency publishing period must be positive and non zero"
        );

        Governed._initialize(_governor);

        for (uint256 i = 0; i < _wlist.length; i++) {
            pricePeekWhitelistData._addToWhitelist(_wlist[i]);
        }
        validPricePeriodInBlocks = _validPricePeriodInBlocks;
        emergencyPublishingPeriodInBlocks = _emergencyPublishingPeriodInBlocks;
        token = IERC20(_tokenAddress);
        coinPair = _coinPair;
        oracleManager = _oracleManager;
        registry = _registry;
        roundInfo = RoundInfoLib.initRoundInfo(_maxOraclesPerRound, _roundLockPeriod);
        maxSubscribedOraclesPerRound = _maxSubscribedOraclesPerRound;
        subscribedOracles = SubscribedOraclesLib.init();
        _publish(_bootstrapPrice);
    }

    /// @notice return the type of provider
    function getPriceProviderType() external pure override returns (IPriceProviderType) {
        return IPriceProviderType.Published;
    }

    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleOwnerAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleOwnerAddr) external override onlyOracleManager {
        require(
            !subscribedOracles.contains(oracleOwnerAddr),
            "Oracle is already subscribed to this coin pair"
        );
        uint256 ownerStake = oracleManager.getStake(oracleOwnerAddr);
        require(ownerStake >= oracleManager.getMinCPSubscriptionStake(), "Not enough stake");

        bool added = _addOrReplaceSubscribedOracle(oracleOwnerAddr);
        require(added, "Not enough stake to add");

        // If the round is not full, then add
        if (!roundInfo.isFull() && !roundInfo.isSelected(oracleOwnerAddr)) {
            roundInfo.addOracleToRound(oracleOwnerAddr);
        }
    }

    /// @notice Unsubscribe an oracle from this coin pair , disallowing it to be selected in rounds.
    /// @param oracleOwnerAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleOwnerAddr) external override onlyOracleManager {
        require(
            subscribedOracles.contains(oracleOwnerAddr),
            "Oracle is not subscribed to this coin pair"
        );

        subscribedOracles.remove(oracleOwnerAddr);
    }

    /// @notice The oracle owner has withdrawn some stake.
    /// Must check if the oracle is part of current round and if he lost his place with the
    /// new stake value (the stake is global and is saved in the supporters contract).
    /// @param oracleOwnerAddr the oracle owner that is trying to withdraw
    function onWithdraw(address oracleOwnerAddr)
        external
        override
        onlyOracleManager
        returns (uint256)
    {
        require(subscribedOracles.contains(oracleOwnerAddr), "Not subscribed to this coin");

        if (!roundInfo.isSelected(oracleOwnerAddr)) {
            // not participating in current round, its ok to withdraw.
            return 0;
        }
        // If the current balance is lower than the unselected address that has the maximum stake
        // or it has less than the needed minimum, then the oracle is replaced.
        (address addr, uint256 otherStake) =
            subscribedOracles.getMaxUnselectedStake(
                oracleManager.getMaxStake,
                roundInfo.selectedOracles
            );
        uint256 minCPSubscriptionStake = oracleManager.getMinCPSubscriptionStake();
        uint256 ownerStake = oracleManager.getStake(oracleOwnerAddr);
        if (ownerStake < minCPSubscriptionStake || otherStake > ownerStake) {
            // The oracleOwnerAddr has lost his place in current round
            roundInfo.removeOracleFromRound(oracleOwnerAddr);
            if (addr != address(0)) {
                roundInfo.addOracleToRound(addr);
            }
        }
        // if not enough stake Unsubscribe directly
        if (ownerStake < minCPSubscriptionStake) {
            subscribedOracles.remove(oracleOwnerAddr);
        }

        require(
            roundInfo.lockPeriodTimestamp > block.timestamp,
            "lockPeriodTimestamp lower than current block timestamp"
        );

        return (roundInfo.lockPeriodTimestamp).sub(block.timestamp);
    }

    //
    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    function switchRound() external override {
        if (roundInfo.number > 0) {
            // Not before the first round
            require(roundInfo.isReadyToSwitch(), "The current round lock period is active");
            _distributeRewards();
        }

        // Setup new round parameters
        roundInfo.switchRound();

        // Select top stake oracles to participate on this round
        address[] memory selected =
            subscribedOracles.sort(oracleManager.getStake, roundInfo.maxOraclesPerRound);
        for (uint256 i = 0; i < selected.length && !roundInfo.isFull(); i++) {
            roundInfo.addOracleToRound(selected[i]);
        }
        emit NewRound(
            msg.sender,
            roundInfo.number,
            roundInfo.totalPoints,
            roundInfo.startBlock,
            roundInfo.lockPeriodTimestamp,
            roundInfo.asArray()
        );
    }

    /// @notice Publish a price.
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param _sigV The array of V-component of Oracle signatures.
    /// @param _sigR The array of R-component of Oracle signatures.
    /// @param _sigS The array of S-component of Oracle signatures.
    function publishPrice(
        uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external override {
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        require(roundInfo.number > 0, "Round not open");
        // require(subscribedOracles.contains(ownerAddr), "Sender oracle not subscribed");
        require(roundInfo.isSelected(ownerAddr), "Voter oracle is not part of this round");
        require(
            roundInfo.length() >= getMinOraclesPerRound(),
            "Minimum selected oracles required not reached"
        );
        require(msg.sender == _votedOracle, "Your address does not match the voted oracle");
        require(_version == PUBLISH_MESSAGE_VERSION, "This contract accepts only V3 format");
        require(_price > 0, "Price must be positive and non-zero");
        require(
            _blockNumber == lastPublicationBlock,
            "Blocknumber does not match the last publication block"
        );
        require(_coinpair == coinPair, "Coin pair - contract mismatch");

        // Verify signatures
        require(
            _sigS.length == _sigR.length && _sigR.length == _sigV.length,
            "Inconsistent signature count"
        );

        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData =
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n148",
                _version,
                _coinpair,
                _price,
                _votedOracle,
                _blockNumber
            );
        bytes32 messageHash = keccak256(hData);

        uint256 validSigs = 0;
        address lastAddr = address(0);
        for (uint256 i = 0; i < _sigS.length; i++) {
            address rec = _recoverSigner(_sigV[i], _sigR[i], _sigS[i], messageHash);
            address ownerRec = oracleManager.getOracleOwner(rec);
            if (roundInfo.isSelected(ownerRec)) validSigs += 1;
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        require(
            validSigs > roundInfo.length() / 2,
            "Valid signatures count must exceed 50% of active oracles"
        );

        roundInfo.addPoints(ownerAddr, 1);
        _publish(_price);

        emit PricePublished(ownerAddr, _price, _votedOracle, _blockNumber);
    }

    /// @notice Publish a price without signature validation (when there is an emergecy!!!).
    /// @param _price Price to report.
    function emergencyPublish(uint256 _price)
        external
        override
        onlyWhitelisted(emergencyPublishWhitelistData)
    {
        require(_price > 0, "Price must be positive and non-zero");
        require(
            block.number > lastPublicationBlock + emergencyPublishingPeriodInBlocks,
            "Emergency publish period didn't started"
        );

        _publish(_price);

        emit EmergencyPricePublished(msg.sender, _price, msg.sender, lastPublicationBlock);
    }

    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (bytes32, bool)
    {
        return (bytes32(currentPrice), _isValid());
    }

    /// @notice Return the current price
    function getPrice()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (uint256)
    {
        return currentPrice;
    }

    // Return if the price is not expired.
    function getIsValid() external view override returns (bool) {
        return _isValid();
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        view
        override
        returns (
            uint256,
            bool,
            uint256
        )
    {
        return (currentPrice, _isValid(), lastPublicationBlock);
    }

    // The maximum count of oracles selected to participate each round
    function maxOraclesPerRound() external view override returns (uint256) {
        return roundInfo.maxOraclesPerRound;
    }

    // The maximum count of oracles selected to participate each round
    function roundLockPeriodSecs() external view override returns (uint256) {
        return roundInfo.roundLockPeriodSecs;
    }

    function isRoundFull() external view returns (bool) {
        return roundInfo.isFull();
    }

    function isOracleInCurrentRound(address oracleOwnerAddr) external view override returns (bool) {
        return roundInfo.isSelected(oracleOwnerAddr);
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleOwnerAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleOwnerAddr) external view override returns (bool) {
        return subscribedOracles.contains(oracleOwnerAddr);
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() external view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
        override
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOwners,
            address[] memory selectedOracles
        )
    {
        (round, startBlock, lockPeriodTimestamp, totalPoints, selectedOwners) = roundInfo
            .getRoundInfo();
        selectedOracles = new address[](selectedOwners.length);
        for (uint256 i = 0; i < selectedOwners.length; i++) {
            selectedOracles[i] = oracleManager.getOracleAddress(selectedOwners[i]);
        }
    }

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(address oracleOwner)
        external
        view
        override
        returns (uint256 points, bool selectedInCurrentRound)
    {
        return roundInfo.getOracleRoundInfo(oracleOwner);
    }

    /// @notice Returns the amount of oracles subscribed to this coin pair.
    function getSubscribedOraclesLen() external view override returns (uint256) {
        return subscribedOracles.length();
    }

    /// @notice Returns the oracle owner address that is subscribed to this coin pair
    /// @param idx index to query.
    function getSubscribedOracleAtIndex(uint256 idx)
        external
        view
        override
        returns (address ownerAddr)
    {
        return subscribedOracles.at(idx);
    }

    // Public variable
    function getMaxSubscribedOraclesPerRound() external view override returns (uint256) {
        return maxSubscribedOraclesPerRound;
    }

    // Public variable
    function getCoinPair() external view override returns (bytes32) {
        return coinPair;
    }

    // Public variable
    function getLastPublicationBlock()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        returns (uint256)
    {
        return lastPublicationBlock;
    }

    // Public variable
    function getValidPricePeriodInBlocks() external view override returns (uint256) {
        return validPricePeriodInBlocks;
    }

    // Public variable
    function getEmergencyPublishingPeriodInBlocks() external view override returns (uint256) {
        return emergencyPublishingPeriodInBlocks;
    }

    // Public variable
    function getOracleManager() external view override returns (IOracleManager) {
        return IOracleManager(oracleManager);
    }

    // Public variable
    function getToken() external view override returns (IERC20) {
        return token;
    }

    // Public variable
    function getRegistry() external view override returns (IRegistry) {
        return registry;
    }

    // Public value from Registry:
    //   The minimum count of oracles selected to participate each round
    function getMinOraclesPerRound() public view override returns (uint256) {
        return this.getRegistry().getUint(RegistryConstantsLib.ORACLE_MIN_ORACLES_PER_ROUND());
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    /// @notice return true if the price is valid
    function _isValid() private view returns (bool) {
        require(block.number >= lastPublicationBlock, "Wrong lastPublicationBlock");
        return (block.number - lastPublicationBlock) < validPricePeriodInBlocks;
    }

    /// @notice add or replace and oracle from the subscribed list of oracles.
    function _addOrReplaceSubscribedOracle(address oracleOwnerAddr) internal returns (bool) {
        if (subscribedOracles.length() < maxSubscribedOraclesPerRound) {
            return subscribedOracles.add(oracleOwnerAddr);
        }
        (uint256 minStake, address minVal) = subscribedOracles.getMin(oracleManager.getStake);
        uint256 vStake = oracleManager.getStake(oracleOwnerAddr);
        if (vStake > minStake) {
            if (subscribedOracles.remove(minVal)) {
                return subscribedOracles.add(oracleOwnerAddr);
            }
        }
        return false;
    }

    /// @notice Distribute rewards to oracles, taking fees from this smart contract.
    function _distributeRewards() private {
        if (roundInfo.totalPoints == 0) return;
        uint256 availableRewardFees = token.balanceOf(address(this));
        if (availableRewardFees == 0) return;

        // Distribute according to points/TotalPoints ratio
        uint256 distSum = 0;
        for (uint256 i = 0; i < roundInfo.length(); i++) {
            address oracleOwnerAddr = roundInfo.at(i);
            uint256 points = roundInfo.getPoints(oracleOwnerAddr);
            uint256 distAmount = ((points).mul(availableRewardFees)).div(roundInfo.totalPoints);
            require(token.transfer(oracleOwnerAddr, distAmount), "Token transfer failed");
            distSum = distSum.add(distAmount);
            emit OracleRewardTransfer(
                roundInfo.number,
                oracleOwnerAddr,
                oracleOwnerAddr,
                distAmount
            );
        }
    }

    // @notice publish a price, called only after verification.
    function _publish(uint256 _price) private {
        lastPublicationBlock = block.number;
        currentPrice = _price;
    }

    /// @notice Recover signer address from v,r,s signature components and hash
    ///
    function _recoverSigner(
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 hash
    ) private pure returns (address) {
        uint8 v0 = v;

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v0 < 27) {
            v0 += 27;
        }

        // If the version is correct return the signer address
        require(v0 == 27 || v0 == 28, "Cannot recover signature");
        return ecrecover(hash, v0, r, s);
    }
}
