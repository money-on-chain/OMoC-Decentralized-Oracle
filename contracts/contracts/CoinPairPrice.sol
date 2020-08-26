// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "./libs/IPriceProviderRegisterEntry.sol";
import {RoundInfoLib} from "./libs/RoundInfoLib.sol";
import {SelectedOraclesLib} from "./libs/SelectedOraclesLib.sol";
import {OracleManager} from "./OracleManager.sol";
import {IterableWhitelistLib} from "./libs/IterableWhitelistLib.sol";
import {CoinPairPriceStorage} from "./CoinPairPriceStorage.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is CoinPairPriceStorage, IPriceProvider, IPriceProviderRegisterEntry {
    using SelectedOraclesLib for SelectedOraclesLib.SelectedOracles;
    using SafeMath for uint256;

    event OracleRewardTransfer(
        uint256 roundNumber,
        address oracleAddress,
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
        uint256 lockPeriodEndBlock,
        address[] selectedOracles
    );

    /// @notice Construct a new contract
    /// @param _governor The governor address.
    /// @param _wlist List of whitelisted contracts (those that can get the price).
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _roundLockPeriodInBlocks The minimum time span for each round before a new one can be started, in blocks.
    /// @param _validPricePeriodInBlocks The time span for which the last published price is valid.
    /// @param _emergencyPublishingPeriodInBlocks The number of blocks that must pass after a publication after which
    //          an emergency publishing must be enabled
    /// @param _bootstrapPrice A price to be set as a bootstraping value for this block
    /// @param _numIdleRounds The number of rounds an oracle must be idle (not participating) before a removal
    /// @param _oracleManager The contract of the oracle manager.
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _roundLockPeriodInBlocks,
        uint256 _validPricePeriodInBlocks,
        uint256 _emergencyPublishingPeriodInBlocks,
        uint256 _bootstrapPrice,
        uint8 _numIdleRounds,
        OracleManager _oracleManager
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
        roundInfo = RoundInfoLib.initRoundInfo(
            _maxOraclesPerRound,
            _roundLockPeriodInBlocks,
            _numIdleRounds
        );
        _publish(_bootstrapPrice);
    }

    /// @notice return the type of provider
    function getPriceProviderType() external override pure returns (IPriceProviderType) {
        return IPriceProviderType.Published;
    }

    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(
            subscribedOracles[oracleAddr] == false,
            "Oracle is already subscribed to this coin pair"
        );

        subscribedOracles[oracleAddr] = true;
        if (!roundInfo.isFull() && !roundInfo.isInCurrentRound(oracleAddr)) {
            roundInfo.addOracleToRound(oracleAddr);
        }
    }

    /// @notice Unsubscribe an oracle from this coin pair , disallowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(
            subscribedOracles[oracleAddr] == true,
            "Oracle is not subscribed to this coin pair"
        );

        subscribedOracles[oracleAddr] = false;
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleAddr) external view returns (bool) {
        return subscribedOracles[oracleAddr];
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool) {
        return roundInfo.canRemoveOracle(oracleAddr);
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Publish a price.
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param _sig_v The array of V-component of Oracle signatures.
    /// @param _sig_r The array of R-component of Oracle signatures.
    /// @param _sig_s The array of S-component of Oracle signatures.
    function publishPrice(
        uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sig_v,
        bytes32[] calldata _sig_r,
        bytes32[] calldata _sig_s
    ) external {
        require(roundInfo.number > 0, "Round not open");
        require(subscribedOracles[msg.sender], "Sender oracle not subscribed");
        require(roundInfo.isInCurrentRound(msg.sender), "Voter oracle is not part of this round");
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
            _sig_s.length == _sig_r.length && _sig_r.length == _sig_v.length,
            "Inconsistent signature count"
        );
        require(
            _sig_s.length > roundInfo.selectedOracles.length() / 2,
            "Signature count must exceed 50% of active oracles"
        );

        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData = abi.encodePacked(
            "\x19Ethereum Signed Message:\n148",
            _version,
            _coinpair,
            _price,
            _votedOracle,
            _blockNumber
        );
        bytes32 messageHash = keccak256(hData);

        address lastAddr = address(0);
        for (uint256 i = 0; i < _sig_s.length; i++) {
            address rec = _recoverSigner(_sig_v[i], _sig_r[i], _sig_s[i], messageHash);
            require(rec != address(0), "Cannot recover signature");
            require(subscribedOracles[rec], "Signing oracle not subscribed");
            require(roundInfo.isInCurrentRound(rec), "Address of signer not part of this round");
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        roundInfo.addPoints(msg.sender, 1);
        _publish(_price);

        emit PricePublished(msg.sender, _price, _votedOracle, _blockNumber);
    }

    /// @notice Publish a price without signature validation (when there is an emergecy!!!).
    /// @param _price Price to report.
    function emergencyPublish(uint256 _price)
        external
        whitelistedOrExternal(emergencyPublishWhitelistData)
    {
        require(_price > 0, "Price must be positive and non-zero");
        require(
            block.number > lastPublicationBlock + emergencyPublishingPeriodInBlocks,
            "Emergency publish period didn't started"
        );

        _publish(_price);

        emit EmergencyPricePublished(msg.sender, _price, msg.sender, lastPublicationBlock);
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek()
        external
        override
        view
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (bytes32, bool)
    {
        require(block.number >= lastPublicationBlock, "Wrong lastPublicationBlock");

        return (
            bytes32(currentPrice),
            (block.number - lastPublicationBlock) < validPricePeriodInBlocks
        );
    }

    /// @notice Return the current price
    function getPrice()
        external
        view
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (uint256)
    {
        return currentPrice;
    }

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodEndBlock,
            uint256 totalPoints,
            address[] memory selectedOracles
        )
    {
        return roundInfo.getRoundInfo();
    }

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(address addr)
        external
        view
        returns (
            uint256 points,
            uint256 selectedInRound,
            bool selectedInCurrentRound
        )
    {
        return roundInfo.getOracleRoundInfo(addr);
    }

    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    function switchRound() external {
        if (roundInfo.number > 0) {
            // Not before the first round
            require(roundInfo.isReadyToSwitch(), "The current round lock period is active");
            _distributeRewards();
        }

        // Setup new round parameters
        roundInfo.switchRound();

        // Select top stake oracles to participate on this round
        _selectOraclesForRound();

        emit NewRound(
            msg.sender,
            roundInfo.number,
            roundInfo.totalPoints,
            roundInfo.startBlock,
            roundInfo.lockPeriodEndBlock,
            roundInfo.selectedOracles.asArray()
        );
    }

    // The maximum count of oracles selected to participate each round
    function maxOraclesPerRound() external view returns (uint256) {
        return roundInfo.maxOraclesPerRound;
    }

    // The maximum count of oracles selected to participate each round
    function roundLockPeriodInBlocks() external view returns (uint256) {
        return roundInfo.roundLockPeriodInBlocks;
    }

    // The number of rounds an oracle must be idle (not participating) before a removal
    function numIdleRounds() external view returns (uint8) {
        return roundInfo.numIdleRounds;
    }

    function isRoundFull() external view returns (bool) {
        return roundInfo.isFull();
    }

    function isOracleInCurrentRound(address oracleAddr) external view returns (bool) {
        return roundInfo.isInCurrentRound(oracleAddr);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    /// @notice Distribute rewards to oracles, taking fees from this smart contract.
    function _distributeRewards() private {
        if (roundInfo.totalPoints == 0) return;
        uint256 availableRewardFees = token.balanceOf(address(this));
        if (availableRewardFees == 0) return;

        // Distribute according to points/TotalPoints ratio
        uint256 distSum = 0;
        for (uint256 i = 0; i < roundInfo.selectedOracles.length(); i++) {
            address oracleAddr = roundInfo.selectedOracles.at(i);
            uint256 points = roundInfo.getPoints(oracleAddr);
            uint256 distAmount = ((points).mul(availableRewardFees)).div(roundInfo.totalPoints);
            (, , address owneraddr) = oracleManager.getOracleRegistrationInfo(oracleAddr);

            require(token.transfer(owneraddr, distAmount), "Token transfer failed");
            distSum = distSum.add(distAmount);
            emit OracleRewardTransfer(roundInfo.number, oracleAddr, owneraddr, distAmount);
        }
    }

    /// @notice Select top-stakers for the current round. Only subscribed oracles to this contract are
    /// considered for selection.
    function _selectOraclesForRound() private {
        roundInfo.clearSelectedOracles();
        /*for (
            address addr = oracleManager.getRegisteredOracleHead();
            addr != address(0) && !roundInfo.isFull();
            addr = oracleManager.getRegisteredOracleNext(addr)
        ) {
            if (subscribedOracles[addr]) {
                roundInfo.addOracleToRound(addr);
            }
        }*/
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
        if (v0 != 27 && v0 != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v0, r, s);
        }
    }
}
