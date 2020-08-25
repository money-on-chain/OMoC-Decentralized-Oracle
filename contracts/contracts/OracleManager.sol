// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOraclesLib.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
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
        SupportersWhitelisted _supportersContract
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
        supportersContract = _supportersContract;
        token = _supportersContract.mocToken();

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

    /// @notice Get expiration number for withdrawal transfer to Delay Machine
    /// @param mocs Amount to be withdrawn
    /// @param user User that is making the withdrawal
    function getWithdrawalExpiration(uint256 mocs, address user) external pure returns (uint256) {
        mocs;
        user;
    }

    /// @notice Update oracle status within round according to stake change
    /// @param mocs Withdrawn amount
    /// @param user Owner of oracle whose status within round will be updated
    function updateOracleRoundByStake(uint256 mocs, address user) external pure {
        mocs;
        user;
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param ownerAddr Address of oracle's owner
    /// @param oracleAddr Address of oracle
    /// @param coinPair Name of coin pair
    function subscribeToCoinPair(address ownerAddr, address oracleAddr, bytes32 coinPair) external {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");
        require(_isOwner(ownerAddr, oracleAddr), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(oracleAddr);

        emit OracleSubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param ownerAddr Address of oracle's owner
    /// @param oracleAddr Address of oracle
    /// @param coinPair Name of coin pair
    function unsubscribeFromCoinPair(address ownerAddr, address oracleAddr, bytes32 coinPair) external {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");
        require(_isOwner(ownerAddr, oracleAddr), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(oracleAddr);

        emit OracleUnsubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address ownerAddr, address oracleAddr, bytes32 coinPair) public view returns (bool) {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");

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
            if (isSubscribed(ownerAddr, oracleAddr, cp)) {
                subscribedCoinpairs[i] = _getCoinPairAddress(cp);
                valid = valid.add(1);
            }
        }

        return (subscribedCoinpairs, valid);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param ownerAddr Address of oracle's owner
    /// @param oracleAddr Address of the oracle to change
    /// @param name The new name to set.
    function setOracleName(address ownerAddr, address oracleAddr, string calldata name) external {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");
        require(_isOwner(ownerAddr, oracleAddr), "Must be called by oracle owner");
        registeredOracles._setName(ownerAddr, name);
    }

    /// @notice Return true if the oracle is registered in the contract
    /// @param ownerAddr The address of the owner of the Oracle to check for.
    function isOracleRegistered(address ownerAddr) external view returns (bool) {
        return registeredOracles._isOracleRegistered(ownerAddr);
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param oracleAddr addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(address oracleAddr)
    external view returns (string memory internetName, uint256 stake, address _owner) {
        _owner = registeredOracles._getOwner(oracleAddr);
        require(registeredOracles._isOracleRegistered(_owner), "Oracle is not registered.");
        internetName = registeredOracles.registeredOracles[_owner].url;
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
    /// @param ownerAddr Address of oracle's owner.
    /// @param oracleAddr The address of the oracle to remove from system.
    function removeOracle(address ownerAddr, address oracleAddr) public {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");
        require(_isOwner(ownerAddr, oracleAddr), "Must be called by oracle owner");

        require(_canRemoveOracle(oracleAddr), "Oracle cannot be removed at this time");

        _unsubscribeAll(ownerAddr, oracleAddr);
        registeredOracles._removeOracle(ownerAddr, 0);
        emit OracleRemoved(ownerAddr, oracleAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr Address of oracle's owner.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address ownerAddr, address oracleAddr) external view returns (bool) {
        return registeredOracles._isOracleRegistered(ownerAddr) && _canRemoveOracle(oracleAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param oracleAddr The address of the oracle.
    function getStake(address oracleAddr) public view returns (uint256 balance) {
        return supportersContract.getMOCBalanceAt(address(this), oracleAddr);
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
    /// @param ownerAddr Address of oracle's owner
    /// @param oracleAddr Address of oracle
    function _unsubscribeAll(address ownerAddr, address oracleAddr) private
    {
        require(registeredOracles._isOracleRegistered(ownerAddr), "Oracle is not registered.");
        require(_isOwner(ownerAddr, oracleAddr), "Must be called by oracle owner");

        (CoinPairPrice[] memory coinpairs, uint count) = getSubscribedCoinPairAddresses(
            ownerAddr,
            oracleAddr
        );
        for (uint i = 0; i < count; i++) {
            coinpairs[i].unsubscribe(oracleAddr);
        }
    }

    // A change contract can act as the owner of an Oracle
    /// @param sender Message sender's address
    /// @param oracleAddr Address of oracle
    function _isOwner(address sender, address oracleAddr) private view returns (bool) {
        return registeredOracles._isOwner(sender, oracleAddr) || governor.isAuthorizedChanger(sender);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }
}
