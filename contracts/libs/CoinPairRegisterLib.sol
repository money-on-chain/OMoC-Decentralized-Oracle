// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

/// @title This contract registers which CoinPairPrice contract will serve
///        prices for a particular coin-pair. Clients can query coin-pair
///        data and associated contract addresses.
library CoinPairRegisterLib {
    struct CoinPairRegisterData {
        mapping(bytes32 => address) coinPairMap;
        bytes32[] coinPairList;
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _registerCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        address addr
    ) internal {
        require(addr != address(0), "Address cannot be zero");
        require(self.coinPairMap[coinPair] == address(0x0), "This coin pair is already registered");
        self.coinPairMap[coinPair] = addr;
        self.coinPairList.push(coinPair);
    }

    /// @notice Unregister a coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array.
    function _unRegisterCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        uint256 hint
    ) internal {
        require(
            self.coinPairMap[coinPair] != address(0x0),
            "This coin pair is already unregistered"
        );
        uint256 idx = _getCoinPairIndex(self, coinPair, hint);
        require(idx < self.coinPairList.length, "Coin pair not found");
        delete self.coinPairMap[coinPair];
        self.coinPairList[idx] = self.coinPairList[self.coinPairList.length - 1];
        self.coinPairList.pop();
    }

    /// @notice Set the address for a coinpair (the old one is lost!!!!)
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _setCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        address addr
    ) internal {
        require(addr != address(0), "Address cannot be zero");
        require(self.coinPairMap[coinPair] != address(0x0), "This coin pair is not registered");
        self.coinPairMap[coinPair] = addr;
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getContractAddress(CoinPairRegisterData storage self, bytes32 coinpair)
        internal
        view
        returns (address)
    {
        return self.coinPairMap[coinpair];
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function _getCoinPairCount(CoinPairRegisterData storage self) internal view returns (uint256) {
        return self.coinPairList.length;
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function _getCoinPairAtIndex(CoinPairRegisterData storage self, uint256 i)
        internal
        view
        returns (bytes32)
    {
        require(i < self.coinPairList.length, "Illegal index");
        return self.coinPairList[i];
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function _getCoinPairIndex(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        uint256 hint
    ) internal view returns (uint256) {
        require(hint < self.coinPairList.length, "Illegal index");
        for (uint256 i = hint; i < self.coinPairList.length; i++) {
            if (self.coinPairList[i] == coinPair) {
                return i;
            }
        }
        return self.coinPairList.length;
    }
}
