pragma solidity 0.6.0;

/// @title This contract registers which CoinPairPrice contract will serve
///        prices for a particular coin-pair. Clients can query coin-pair
///        data and associated contract addresses.
contract CoinPairRegister {
    mapping(bytes32 => address) coinPairMap;
    bytes32[] coinPairList;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks


    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _registerCoinPair(bytes32 coinPair, address addr) internal
    {
        require(addr != address(0), "Address cannot be zero");
        require(coinPairMap[coinPair] == address(0x0), "This coin pair is already registered");
        coinPairMap[coinPair] = addr;
        coinPairList.push(coinPair);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) public view returns (address)
    {
        return coinPairMap[coinpair];
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() public view returns (uint)
    {
        return coinPairList.length;
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) public view returns (bytes32)
    {
        require(i < coinPairList.length, "Illegal index");
        return coinPairList[i];
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}