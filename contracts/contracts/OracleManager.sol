// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOraclesLib.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {OracleManagerStorage} from "./OracleManagerStorage.sol";

contract OracleManager is OracleManagerStorage {
    using SafeMath for uint256;

    event OracleRegistered(address caller, address addr, string internetName);
    event OracleStakeAdded(address caller, address addr, uint256 stake);
    event OracleSubscribed(address caller, address addr, bytes32 coinpair);
    event OracleUnsubscribed(address caller, address addr, bytes32 coinpair);
    event OracleRemoved(address caller, address addr);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _minCPSubscriptionStake The minimum amount of tokens required as stake for a coin pair subscription.
    /// @param _supportersContract the Supporters contract contract address.
    function initialize(
        IGovernor _governor,
        uint256 _minCPSubscriptionStake,
        Staking _stakingContract
    ) external initializer {
        require(
            address(_supportersContract) != address(0),
            "Supporters contract address must be != 0"
        );
        require(
            address(_supportersContract.mocToken()) != address(0),
            "Token contract address must be != 0"
        );
        require(
            _minCPSubscriptionStake > 0,
            "The minimum coin pair subscription stake amount cannot be zero"
        );

        Governed._initialize(_governor);
        stakingContract = _stakingContract;

        minCPSubscriptionStake = _minCPSubscriptionStake;
        registeredOracles = IterableOraclesLib.initRegisteredOracles();
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(bytes32 coinPair, address addr) external onlyAuthorizedChanger() {
        coinPairRegisterData._registerCoinPair(coinPair, addr);
    }

    /// @notice Registers an oracle in the system.
    /// @param ownerAddr Address of the Oracle's owner.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(address ownerAddr, address oracleAddr, string calldata internetName) external {
        require(!registeredOracles._isOracleRegistered(ownerAddr), "Oracle already registered");
        require(ownerAddr != address(0), "Owner address cannot be zero");
        require(oracleAddr != address(0), "Oracle address cannot be zero");

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
    function onWithdraw(address oracleOwnerAddr) external returns (uint256) {
        oracleOwnerAddr;
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param caller Address of message sender
    /// @param oracleAddr Address of oracle
    /// @param coinPair Name of coin pair
    function subscribeToCoinPair(address caller, address oracleAddr, bytes32 coinPair) external {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        require(_isOwner(caller, oracleAddr), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(oracleAddr);

        emit OracleSubscribed(caller, oracleAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param caller Address of message sender
    /// @param oracleAddr Address of oracle
    /// @param coinPair Name of coin pair
    function unsubscribeFromCoinPair(address caller, address oracleAddr, bytes32 coinPair) external {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        require(_isOwner(caller, oracleAddr), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(oracleAddr);

        emit OracleUnsubscribed(caller, oracleAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address oracleAddr, bytes32 coinPair) public view returns (bool) {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        return ctAddr.isSubscribed(oracleAddr);
    }

    /// @notice Returns the list of subscribed coinpair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr)
        public
        view
        returns (CoinPairPrice[] memory addresses, uint256 count)
    {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        CoinPairPrice[] memory subscribedCoinpairs = new CoinPairPrice[](coinPairCount);
        uint256 valid = 0;
        for (uint256 i = 0; i < coinPairCount; i++) {
            bytes32 cp = coinPairRegisterData._getCoinPairAtIndex(i);
            if (isSubscribed(oracleAddr, cp)) {
                subscribedCoinpairs[i] = _getCoinPairAddress(cp);
                valid = valid.add(1);
            }
        }

        return (subscribedCoinpairs, valid);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param caller Address of message sender
    /// @param oracleAddr Address of the oracle to change
    /// @param name The new name to set.
    function setOracleName(address caller, address oracleAddr, string calldata name) external {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        require(_isOwner(caller, oracleAddr), "Must be called by oracle owner");
        registeredOracles._setName(caller, name);
    }

    /// @notice Return true if the oracle is registered in the contract
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool) {
        return registeredOracles._isOracleRegistered(oracleAddr);
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param oracleAddr addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(address oracleAddr)
    external view returns (string memory internetName, uint256 stake, address _owner) {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        
        _owner = registeredOracles._getOwner(oracleAddr);
        internetName = registeredOracles._getInternetName(oracleAddr);
        stake = getStake(oracleAddr);
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param oracleAddr address of the oracle to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(address oracleAddr, bytes32 coinpair)
        external
        view
        returns (
            uint256 points,
            uint256 selectedInRound,
            bool selectedInCurrentRound
        )
    {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinpair);
        (points, selectedInRound, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(oracleAddr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param caller Address of message sender
    /// @param oracleAddr The address of the oracle to remove from system.
    function removeOracle(address caller, address oracleAddr) public {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        require(_isOwner(caller, oracleAddr), "Must be called by oracle owner");

        require(_canRemoveOracle(oracleAddr), "Oracle cannot be removed at this time");

        _unsubscribeAll(caller, oracleAddr);
        registeredOracles._removeOracle(caller, 0);
        emit OracleRemoved(caller, oracleAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool) {
        return registeredOracles._isOracleRegistered(oracleAddr) && _canRemoveOracle(oracleAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param oracleAddr The address of the oracle.
    function getStake(address oracleAddr) public view returns (uint256 balance) {
        address ownerAddr = registeredOracles.getOwnerFromOracle(oracleAddr);
        return stakingContract.getBalance(ownerAddr);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256) {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function _canRemoveOracle(address oracleAddr) private view returns (bool) {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        bool canRemove = true;
        for (uint256 i = 0; i < coinPairCount && canRemove; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            canRemove = canRemove && cp.canRemoveOracle(oracleAddr);
        }
        return canRemove;
    }

    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param caller Address of message sender
    /// @param oracleAddr Address of oracle
    function _unsubscribeAll(address caller, address oracleAddr) private
    {
        require(registeredOracles._isOracleRegistered(oracleAddr), "Oracle is not registered.");
        require(_isOwner(caller, oracleAddr), "Must be called by oracle owner");

        (CoinPairPrice[] memory coinpairs, uint count) = getSubscribedCoinPairAddresses(
            oracleAddr
        );
        for (uint i = 0; i < count; i++) {
            coinpairs[i].unsubscribe(oracleAddr);
        }
    }

    // A change contract can act as the owner of an Oracle
    /// @param caller Message sender's address
    /// @param oracleAddr Address of oracle
    function _isOwner(address caller, address oracleAddr) private view returns (bool) {
        return registeredOracles._isOwner(caller, oracleAddr) || governor.isAuthorizedChanger(caller);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }
}
