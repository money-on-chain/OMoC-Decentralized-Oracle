// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IOracleManager} from "@moc/shared/contracts/IOracleManager.sol";
import {IStakingMachine} from "@moc/shared/contracts/IStakingMachine.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {OracleManagerStorage} from "./OracleManagerStorage.sol";

contract OracleManager is OracleManagerStorage, IOracleManager {
    using SafeMath for uint256;

    event OracleRegistered(address caller, address addr, string internetName);
    event OracleStakeAdded(address caller, address addr, uint256 stake);
    event OracleSubscribed(address caller, bytes32 coinpair);
    event OracleUnsubscribed(address caller, bytes32 coinpair);
    event OracleRemoved(address caller);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _governor The address of the contract which governs this one
    /// @param _minCPSubscriptionStake The minimum amount of tokens required as stake for a coin pair subscription.
    /// @param _stakingContract the Staking contract address.
    /// @param _wlist whitelisted contract that can call this one (usually only staking).
    function initialize(
        IGovernor _governor,
        uint256 _minCPSubscriptionStake,
        Staking _stakingContract,
        address[] calldata _wlist
    ) external initializer {
        require(address(_stakingContract) != address(0), "Staking contract address must be != 0");
        require(
            _minCPSubscriptionStake > 0,
            "The minimum coin pair subscription stake amount cannot be zero"
        );

        Governed._initialize(_governor);
        stakingContract = _stakingContract;

        minCPSubscriptionStake = _minCPSubscriptionStake;
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(bytes32 coinPair, address addr)
        external
        override
        onlyAuthorizedChanger
    {
        coinPairRegisterData._registerCoinPair(coinPair, addr);
    }

    /**
     @notice Add to the list of contracts that can stake in this contract

     @param  _whitelisted - the override coinPair
    */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     @notice Remove from the list of contracts that can stake in this contract

     @param _whitelisted - the override coinPair
    */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
    }

    /// @notice Registers an oracle in the system.
    /// @param ownerAddr Address of the Oracle's owner.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(
        address ownerAddr,
        address oracleAddr,
        string calldata internetName
    ) external override onlyWhitelisted(iterableWhitelistData) {
        registeredOracles._registerOracle(ownerAddr, oracleAddr, internetName);
        emit OracleRegistered(ownerAddr, oracleAddr, internetName);
    }

    /// @notice The oracle owner did a partial withdrawal of funds
    /// 1. The oracle address is searched by the owner address.
    /// 2. Each coin pair to which the oracle is subscribed is consulted to:
    ///   - Check if the new amount is enough to stay in the current round.
    ///       If not the oracle is replaced and lost his points.
    ///   - Get the timestamp for the round end.
    /// The return value is the maximum timestamp from all the coin pairs.
    /// @param oracleOwnerAddr Address of oracle owner
    /// @return the timestamp until which the funds must be locked.
    function onWithdraw(address oracleOwnerAddr)
        external
        override
        onlyWhitelisted(iterableWhitelistData)
        returns (uint256)
    {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        uint256 timestamp = 0;
        uint256 maxTimestamp = 0;
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            timestamp = cp.onWithdraw(oracleOwnerAddr);
            if (timestamp > maxTimestamp) {
                maxTimestamp = timestamp;
            }
        }
        return maxTimestamp;
    }

    /// @notice Used by the coin pair to get the oracle address from the oracleOwnerAddress.
    /// @param  oracleOwnerAddr the address of the owner of the oracle.
    /// @return oracleAddr Address of oracle
    function getOracleAddress(address oracleOwnerAddr)
        public
        view
        override
        returns (address oracleAddr)
    {
        return registeredOracles._getOracleAddress(oracleOwnerAddr);
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function subscribeToCoinPair(address ownerAddr, bytes32 coinPair)
        external
        override
        authorizedChangerOrWhitelisted
    {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(ownerAddr);

        emit OracleSubscribed(ownerAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function unSubscribeFromCoinPair(address ownerAddr, bytes32 coinPair)
        external
        override
        authorizedChangerOrWhitelisted
    {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(ownerAddr);

        emit OracleUnsubscribed(ownerAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address ownerAddr, bytes32 coinPair)
        external
        view
        override
        returns (bool)
    {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        return ctAddr.isSubscribed(ownerAddr);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param ownerAddr Address of message sender
    /// @param name The new name to set.
    function setOracleName(address ownerAddr, string calldata name)
        external
        override
        authorizedChangerOrWhitelisted
    {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setName(ownerAddr, name);
    }

    /// @notice Change the oracle address
    /// @param ownerAddr Address of message sender
    /// @param oracleAddr The new oracle address
    function setOracleAddress(address ownerAddr, address oracleAddr)
        external
        override
        authorizedChangerOrWhitelisted
    {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setOracleAddress(ownerAddr, oracleAddr);
    }

    /// @notice Return true if the oracle is registered in the contract
    /// @param ownerAddr The address of the owner of the Oracle to check for.
    function isOracleRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param ownerAddr address of the oracle owner to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(address ownerAddr, bytes32 coinpair)
        external
        view
        override
        returns (uint256 points, bool selectedInCurrentRound)
    {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinpair);
        (points, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(ownerAddr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param ownerAddr Address of message sender
    function removeOracle(address ownerAddr) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        _unsubscribeAll(ownerAddr);
        require(_canRemoveOracle(ownerAddr), "Not ready to remove");
        registeredOracles._removeOracle(ownerAddr);
        emit OracleRemoved(ownerAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function canRemoveOracle(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr) && _canRemoveOracle(ownerAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param ownerAddr The address of the oracle's owner.
    function getStake(address ownerAddr) public view override returns (uint256 balance) {
        return stakingContract.getBalance(ownerAddr);
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param ownerAddr The address of the oracle's owner.
    function getOracleRegistrationInfo(address ownerAddr)
        external
        view
        override
        returns (
            string memory internetName,
            uint256 stake,
            address oracleAddr
        )
    {
        (oracleAddr, internetName) = registeredOracles._getOracleInfo(ownerAddr);
        stake = getStake(ownerAddr);
    }

    /// @notice Returns true if oracle is registered.
    /// @param ownerAddr The address of the oracle's owner.
    function isRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Used by CoinPair
    /// @param oracleAddr The oracle address not the owner address.
    function getOracleOwner(address oracleAddr) external view override returns (address) {
        return registeredOracles._getOwner(oracleAddr);
    }

    /// @notice Returns the amount of owners registered.
    function getRegisteredOraclesLen() external view override returns (uint256) {
        return registeredOracles._getLen();
    }

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(uint256 idx)
        external
        view
        override
        returns (
            address ownerAddr,
            address oracleAddr,
            string memory url
        )
    {
        return registeredOracles._getOracleAtIndex(idx);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view override returns (uint256) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view override returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view override returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    function getMaxStake(address[] calldata addresses)
        external
        view
        override
        returns (address, uint256)
    {
        return stakingContract.getMaxBalance(addresses);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint)
        external
        view
        override
        returns (uint256)
    {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }

    // Public variable
    function getStakingContract() external view override returns (IStakingMachine) {
        return stakingContract;
    }

    // Public variable
    function getMinCPSubscriptionStake() external view override returns (uint256) {
        return minCPSubscriptionStake;
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function _canRemoveOracle(address ownerAddr) private view returns (bool) {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isOracleInCurrentRound(ownerAddr)) {
                return false;
            }
        }
        return true;
    }

    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param ownerAddr Address of the oracle owner.
    function _unsubscribeAll(address ownerAddr) private {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isSubscribed(ownerAddr)) {
                cp.unsubscribe(ownerAddr);
            }
        }
    }

    // A change contract can act as the owner of an Oracle
    /// @param oracleOwner Message sender's address
    function _isOwnerRegistered(address oracleOwner) private view returns (bool) {
        return registeredOracles._isOwnerRegistered(oracleOwner);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }
}
