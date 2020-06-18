pragma solidity ^0.6.0;

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

    /// @notice Set the address for a coinpair (the old one is lost!!!!)
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _setCoinPair(bytes32 coinPair, address addr) internal
    {
        require(addr != address(0), "Address cannot be zero");
        require(coinPairMap[coinPair] != address(0x0), "This coin pair is not registered");
        coinPairMap[coinPair] = addr;
    }


    /// @notice Unregister a coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function _unRegisterCoinPair(bytes32 coinPair, uint256 hint) internal
    {
        require(coinPairMap[coinPair] != address(0x0), "This coin pair is already unregistered");
        uint256 idx = getCoinPairIndex(coinPair, hint);
        require(idx < coinPairList.length, "Coin pair not found");
        delete coinPairMap[coinPair];
        coinPairList[idx] = coinPairList[coinPairList.length - 1];
        coinPairList.pop();
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

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) public view returns (uint256)
    {
        require(hint < coinPairList.length, "Illegal index");
        for (uint256 i = hint; i < coinPairList.length; i++) {
            if (coinPairList[i] == coinPair) {
                return i;
            }
        }
        return coinPairList.length;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}