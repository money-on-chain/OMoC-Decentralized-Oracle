pragma solidity ^0.6.0;

import {CoinPairPrice} from "./CoinPairPrice.sol";

interface IStakingMachine {
    /// @notice Used by the voting machine to lock the current balance of MOCs.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 untilTimestamp) external;

    /// @notice Accept a deposit from an account.
    /// Delegate to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    function deposit(uint256 mocs, address destination) external;

    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    /// @param source the address that approved the transfer
    function depositFrom(
        uint256 mocs,
        address destination,
        address source
    ) external;

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param mocs token quantity
    /// @param oracleAddr oracle from which funds will be withdrawn
    function withdraw(uint256 mocs, address oracleAddr) external;

    /// @notice Reports the balance of MOCs for a specific user.
    /// @param user user address
    function getBalance(address user) external view returns (uint256);

    /// @notice Reports the locked balance of MOCs for a specific user.
    /// @param user user address
    function getLockedBalance(address user) external view returns (uint256);

    /// @notice Reports the total amount of locked MOCs in staking state.
    function getTotalLockedBalance() external view returns (uint256);
}

interface IStakingMachineOracles {
    /// @notice Register an oracle
    /// @param oracleAddr address of the oracle (from which we publish prices)
    /// @param url url used by the oracle server
    function registerOracle(address oracleAddr, string calldata url) external;

    /// @notice Change the oracle "internet" name (URI)
    /// @param oracleAddr Address of the oracle to change
    /// @param url The new url to set.
    function setOracleName(address oracleAddr, string calldata url) external;

    /// @notice Return true if the oracle is registered.
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool);

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool);

    /// @notice Remove an oracle.
    /// @param oracleAddr address of the oracle
    function removeOracle(address oracleAddr) external;

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256);

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32);

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinPair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinPair) external view returns (address);

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256);

    /// @notice Subscribe an oracle to a coin pair.
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to subscribe, for example BTCUSD
    function subscribeToCoinPair(address oracleAddr, bytes32 coinPair) external;

    /// @notice Unsubscribe an oracle from a coin pair.
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function unsubscribeFromCoinPair(address oracleAddr, bytes32 coinPair) external;

    /// @notice Returns true if an oracle is subscribed to a coin pair
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function isSubscribed(address oracleAddr, bytes32 coinPair) external view returns (bool);

    /// @notice Returns the list of subscribed coinpair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr)
        external
        view
        returns (CoinPairPrice[] memory addresses, uint256 count);
}
