pragma solidity 0.6.0;

import {CoinPairPrice} from "./CoinPairPrice.sol";

/// This contract manages the Oracle and CoinPair registration info.
/// The Oracle python server interacts with this contract:
/// - Coin pair registration
/// - Oracle registration to coin pairs
/// - Access Oracle info (oracle address + url) indexed by oracle owner address
/// - Get the oracle information (url + the specifics of some coin pair rounds) from an oracle address
/// - Get the oracle address from the owner address.
interface IOracleManager {

    // prettier-ignore
    struct OracleManagerCallbacks {
        // Get the stake stored in the supporters smart-contract
        function (address) external view returns (uint256) getOracleOwnerStake;
    }

    /// @notice Register a new coin pair contract (the contract must be created separately).
    /// Once created the coin pairs cannot be removed.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coin pair.
    function registerCoinPair(bytes32 coinPair, address addr) external;


    /// Register an oracle in the system must be called by the oracle owner.
    /// @notice Registers the oracle and transfer the specified caller's MOC token stake.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(address oracleOwnerAddr, address oracleAddr, string calldata internetName) external;

    /// @notice Change the oracle "internet" name (URI), called by the owner.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param name The new name to set.
    function setOracleName(address oracleOwnerAddr, string calldata name) external;


    /// @notice Change the oracle address, called by the owner.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param oracleAddr new value for the address of the oracle
    function setOracleAddress(address oracleOwnerAddr, address oracleAddr) external;


    /// @notice Removes the oracle registration info. Must be called by the owner
    /// The oracle must be previously unregistered from all coin pairs.
    /// @param oracleOwnerAddr The address of the owner of the oracle to remove from system.
    function removeOracle(address oracleOwnerAddr) external;


    /// @notice Subscribe a registered oracle to participate in the next round of a registered coin-pair.
    /// @param oracleOwnerAddr Address of oracle owner
    function subscribeToCoinPair(address oracleOwnerAddr, bytes32 coinPair) external;

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair.
    /// The oracle is flagged so it is not selected in the next round.
    /// @param oracleOwnerAddr Address of oracle owner
    function unsubscribeFromCoinPair(address oracleOwnerAddr, bytes32 coinPair) external;

    /// @notice The oracle owner did a partial withdrawal of funds
    /// 1. The oracle address is searched by the owner address.
    /// 2. Each coin pair to which the oracle is subscribed is consulted to:
    ///   - Check if the new amount is enough to stay in the current round.
    ///       If not the oracle is replaced and lost his points.
    ///   - Get the timestamp for the round end.
    /// The return value is the maximum timestamp from all the coin pairs.
    /// @param oracleOwnerAddr Address of oracle owner
    /// @return the timestamp until which the funds must be locked.
    function onWithdraw(address oracleOwnerAddr) external returns (uint256);




    //////////////////////////////////////////////////////////////////////////////////// GETTERS USED BY COINPAIR
    /// @notice Used by the coin pair to get the oracle address from the oracleOwnerAddress.
    /// @param  oracleOwnerAddr the address of the owner of the oracle.
    /// @return oracleAddr Address of oracle
    function getOracleAddress(address oracleOwnerAddr) external view returns (address oracleAddr);
    //////////////////////////////////////////////////////////////////////////////////// GETTERS USED BY COINPAIR END











    //////////////////////////////////////////////////////////////////////////////////// GETTERS

    // TODO: Check what is the minimum amount of getters the python server needs.


    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address oracleAddr, bytes32 coinPair) external view returns (bool);

    /// @notice Returns the list of subscribed coin pair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr)
    external view returns (CoinPairPrice[] memory addresses, uint count);

    /// @notice Return true if the oracle is registered on this coin-pair
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool);

    /// @notice Returns registration information for a registered Oracle.
    /// @param oracleAddr addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(address oracleAddr)
    external view returns (string memory internetName, uint stake, address _owner);

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param oracleAddr address of the oracle to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(address oracleAddr, bytes32 coinpair)
    external view returns (uint points, uint selectedInRound, bool selectedInCurrentRound);



    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool);


    /// @notice Get the stake in MOCs that an oracle has.
    /// @param oracleAddr The address of the oracle.
    function getStake(address oracleAddr) external view returns (uint256 balance);

    //////////////////////////////////////////////////////////////////////////////////// GETTER TO LIST COIN PAIRS

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint);

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32);

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address);


    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256);

    //////////////////////////////////////////////////////////////////////////////////// GETTER TO LIST COIN PAIRS END
}
