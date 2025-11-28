// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {IOracleManager} from "@moc/shared/contracts/ICoinPairPrice.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {RoundInfoLib} from "./libs/RoundInfoLib.sol";
import {SubscribedOraclesLib} from "./libs/SubscribedOraclesLib.sol";
import {OracleManager} from "./OracleManager.sol";
import {CoinPairPriceStorage} from "./CoinPairPriceStorage.sol";
import {RegistryConstantsLib} from "@moc/shared/contracts/RegistryConstants.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
abstract contract RoundManager is CoinPairPriceStorage {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;
    using SafeMath for uint256;

    event OracleRewardTransfer(
        uint256 roundNumber,
        address oracleOwnerAddress,
        address toOwnerAddress,
        uint256 amount
    );
    event NewRound(
        address caller,
        uint256 number,
        uint256 totalPoints,
        uint256 startBlock,
        uint256 lockPeriodTimestamp,
        address[] selectedOracles
    );

    /// @notice Initializer
    /// @param _governor The governor address.
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _maxSubscribedOraclesPerRound The maximum count of subscribed oracles
    /// @param _roundLockPeriod The minimum time span for each round before a new one can be started, in secs.
    /// @param _oracleManager The contract of the oracle manager.
    /// @param _registry The registry contract
    function __RoundManager_init(
        IGovernor _governor,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _maxSubscribedOraclesPerRound,
        uint256 _roundLockPeriod,
        OracleManager _oracleManager,
        IRegistry _registry
    ) internal {
        require(_coinPair != bytes32(0), "Coin pair must be valid");
        require(
            _tokenAddress != address(0),
            "The MOC token address must be provided in constructor"
        );

        Governed._initialize(_governor);
        coinPair = _coinPair;
        token = IERC20(_tokenAddress);
        oracleManager = _oracleManager;
        registry = _registry;
        roundInfo = RoundInfoLib.initRoundInfo(_maxOraclesPerRound, _roundLockPeriod);
        maxSubscribedOraclesPerRound = _maxSubscribedOraclesPerRound;
        subscribedOracles = SubscribedOraclesLib.init();
    }

    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleOwnerAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleOwnerAddr) external onlyOracleManager {
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
    function unsubscribe(address oracleOwnerAddr) external onlyOracleManager {
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
    function onWithdraw(address oracleOwnerAddr) external onlyOracleManager returns (uint256) {
        if (!roundInfo.isSelected(oracleOwnerAddr)) {
            // not participating in current round, its ok to withdraw.
            return 0;
        }
        // If the current balance is lower than the unselected address that has the maximum stake
        // or it has less than the needed minimum, then the oracle is replaced.
        (address addr, uint256 otherStake) = subscribedOracles.getMaxUnselectedStake(
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

        if (roundInfo.lockPeriodTimestamp > block.timestamp) {
            return (roundInfo.lockPeriodTimestamp).sub(block.timestamp);
        } else {
            return 0;
        }
    }

    //
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
        address[] memory selected = subscribedOracles.sort(
            oracleManager.getStake,
            roundInfo.maxOraclesPerRound
        );
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

    // The maximum count of oracles selected to participate each round
    function maxOraclesPerRound() external view returns (uint256) {
        return roundInfo.maxOraclesPerRound;
    }

    // The maximum count of oracles selected to participate each round
    function roundLockPeriodSecs() external view returns (uint256) {
        return roundInfo.roundLockPeriodSecs;
    }

    function isRoundFull() external view returns (bool) {
        return roundInfo.isFull();
    }

    function isOracleInCurrentRound(address oracleOwnerAddr) external view returns (bool) {
        return roundInfo.isSelected(oracleOwnerAddr);
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleOwnerAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleOwnerAddr) external view returns (bool) {
        return subscribedOracles.contains(oracleOwnerAddr);
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
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
    function getOracleRoundInfo(
        address oracleOwner
    ) external view returns (uint256 points, bool selectedInCurrentRound) {
        return roundInfo.getOracleRoundInfo(oracleOwner);
    }

    /// @notice Returns the amount of oracles subscribed to this coin pair.
    function getSubscribedOraclesLen() external view returns (uint256) {
        return subscribedOracles.length();
    }

    /// @notice Returns the oracle owner address that is subscribed to this coin pair
    /// @param idx index to query.
    function getSubscribedOracleAtIndex(uint256 idx) external view returns (address ownerAddr) {
        return subscribedOracles.at(idx);
    }

    // Public variable
    function getMaxSubscribedOraclesPerRound() external view returns (uint256) {
        return maxSubscribedOraclesPerRound;
    }

    // Public variable
    function getOracleManager() external view returns (IOracleManager) {
        return IOracleManager(oracleManager);
    }

    // Public variable
    function getToken() external view returns (IERC20) {
        return token;
    }

    // Public variable
    function getRegistry() external view returns (IRegistry) {
        return registry;
    }

    // Public value from Registry:
    //   The minimum count of oracles selected to participate each round
    function getMinOraclesPerRound() public view virtual returns (uint256) {
        return this.getRegistry().getUint(RegistryConstantsLib.ORACLE_MIN_ORACLES_PER_ROUND());
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

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
    function _distributeRewards() internal {
        if (roundInfo.totalPoints == 0) return;
        uint256 availableRewardFees = token.balanceOf(address(this));
        if (availableRewardFees == 0) return;

        // Distribute according to points/TotalPoints ratio
        for (uint256 i = 0; i < roundInfo.length(); i++) {
            address oracleOwnerAddr = roundInfo.at(i);
            uint256 points = roundInfo.getPoints(oracleOwnerAddr);
            if (points == 0) {
                continue;
            }
            uint256 distAmount = ((points).mul(availableRewardFees)).div(roundInfo.totalPoints);
            require(token.transfer(oracleOwnerAddr, distAmount), "Token transfer failed");
            emit OracleRewardTransfer(
                roundInfo.number,
                oracleOwnerAddr,
                oracleOwnerAddr,
                distAmount
            );
        }
    }

    /// @notice Transfer coinbase
    function _transfer(address _to, uint256 _amount) internal {
        if (_amount > 0) {
            require(_to != address(0), "Invalid address");
            (bool success, ) = _to.call{value: _amount}("");
            require(success, "Coinbase transfer failed");
        }
    }

    /// @notice Recover signer address from v,r,s signature components and hash
    ///
    function _recoverSigner(
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 hash
    ) internal pure returns (address) {
        uint8 v0 = v;

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v0 < 27) {
            v0 += 27;
        }

        // If the version is correct return the signer address
        require(v0 == 27 || v0 == 28, "Cannot recover signature");
        return ecrecover(hash, v0, r, s);
    }

    function _validateExecution(
        address _ownerAddr,
        uint256 _version,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS,
        bytes32 _messageHash
    ) internal view {
        require(roundInfo.number > 0, "Round not open");
        require(roundInfo.isSelected(_ownerAddr), "Voter oracle is not part of this round");
        require(
            roundInfo.length() >= getMinOraclesPerRound(),
            "Minimum selected oracles required not reached"
        );
        require(msg.sender == _votedOracle, "Your address does not match the voted oracle");
        require(_version == PUBLISH_MESSAGE_VERSION, "This contract accepts only V3 format");
        require(
            _blockNumber == lastPublicationBlock,
            "Blocknumber does not match the last publication block"
        );

        // Verify signatures
        require(
            _sigS.length == _sigR.length && _sigR.length == _sigV.length,
            "Inconsistent signature count"
        );

        uint256 validSigs = 0;
        address lastAddr = address(0);
        for (uint256 i = 0; i < _sigS.length; i++) {
            address rec = _recoverSigner(_sigV[i], _sigR[i], _sigS[i], _messageHash);
            address ownerRec = oracleManager.getOracleOwner(rec);
            if (roundInfo.isSelected(ownerRec)) validSigs += 1;
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        require(
            validSigs > roundInfo.length() / 2,
            "Valid signatures count must exceed 50% of active oracles"
        );
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
