// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

/**
  @notice Based on heavily on EnumberableSet, but with different contents.
  @dev An iterable mapping of addresses to Oracle struct, used to check oracles' data.
 */

library IterableOraclesLib {
    struct Oracle {
        address addr;
        string url;
    }

    struct IterableOraclesData {
        Oracle[] _values;
        // The key is the oracle Owner
        mapping(address => uint256) _indexes;
        // The key is the oracle Address, the value the owner
        mapping(address => address) registeredOwners;
    }

    /**
     * @dev Check if an oracle is registered
     * @return Bool
     */
    function _isOracleRegistered(IterableOraclesData storage self, address oracleAddr)
        internal
        view
        returns (bool)
    {
        return self.registeredOwners[oracleAddr] != address(0);
    }

    /// @notice Check if an owner is registered
    function _isOwnerRegistered(IterableOraclesData storage self, address owner)
        internal
        view
        returns (bool)
    {
        return self._indexes[owner] != 0;
    }

    /**
     * @dev Register oracle
     */
    function _registerOracle(
        IterableOraclesData storage self,
        address owner,
        address oracle,
        string memory url
    ) internal {
        require(owner != address(0), "Owner address cannot be 0x0");
        require(oracle != address(0), "Oracle address cannot be 0x0");
        require(!_isOwnerRegistered(self, owner), "Owner already registered");
        require(!_isOracleRegistered(self, oracle), "Oracle already registered");
        // Add oracle address
        self.registeredOwners[oracle] = owner;
        // EnumberableSet.add
        self._values.push(Oracle({addr: oracle, url: url}));
        // The value is stored at length-1, but we add 1 to all indexes and use 0 as a sentinel value
        self._indexes[owner] = self._values.length;
    }

    /**
     * @dev Remove oracle
     */
    function _removeOracle(IterableOraclesData storage self, address owner) internal {
        require(owner != address(0), "Owner address cannot be 0x0");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        uint256 toDeleteIndex = valueIndex - 1;
        // Delete oracle address entry
        address oracleAddr = self._values[toDeleteIndex].addr;

        // EnumberableSet.remove (almost)
        uint256 lastIndex = self._values.length - 1;
        Oracle memory lastValue = self._values[lastIndex];
        address lastOwner = self.registeredOwners[lastValue.addr];
        require(lastOwner != address(0), "Unexpected error");
        self._values[toDeleteIndex] = lastValue;
        self._indexes[lastOwner] = toDeleteIndex + 1;
        self._values.pop();
        delete self._indexes[owner];
        delete self.registeredOwners[oracleAddr];
    }

    /// @notice Sets oracle's name.
    function _setName(
        IterableOraclesData storage self,
        address owner,
        string memory url
    ) internal {
        require(_isOwnerRegistered(self, owner), "Oracle owner is not registered");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        self._values[valueIndex - 1].url = url;
    }

    /// @notice Sets oracle's name.
    function _setOracleAddress(
        IterableOraclesData storage self,
        address owner,
        address oracleAddr
    ) internal {
        require(_isOwnerRegistered(self, owner), "Oracle owner is not registered");
        require(!_isOracleRegistered(self, oracleAddr), "Oracle already registered");
        require(owner != address(0), "Owner address cannot be 0x0");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        self._values[valueIndex - 1].addr = oracleAddr;
        self.registeredOwners[oracleAddr] = owner;
    }

    /// @notice Returns the amount of owners registered.
    function _getLen(IterableOraclesData storage self) internal view returns (uint256) {
        return self._values.length;
    }

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function _getOracleAtIndex(IterableOraclesData storage self, uint256 idx)
        internal
        view
        returns (
            address ownerAddr,
            address oracleAddr,
            string memory url
        )
    {
        require(idx < self._values.length, "Illegal index");
        Oracle memory ret = self._values[idx];
        return (self.registeredOwners[ret.addr], ret.addr, ret.url);
    }

    /// @notice Returns address of oracle's owner.
    function _getOwner(IterableOraclesData storage self, address oracleAddr)
        internal
        view
        returns (address)
    {
        return self.registeredOwners[oracleAddr];
    }

    /// @notice Returns oracle address.
    function _getOracleInfo(IterableOraclesData storage self, address owner)
        internal
        view
        returns (address, string memory)
    {
        if (self._indexes[owner] == 0) {
            return (address(0), "");
        }
        Oracle memory ret = self._values[self._indexes[owner] - 1];
        return (ret.addr, ret.url);
    }

    /// @notice Returns oracle address.
    function _getOracleAddress(IterableOraclesData storage self, address owner)
        internal
        view
        returns (address)
    {
        if (self._indexes[owner] == 0) {
            return address(0);
        }
        return self._values[self._indexes[owner] - 1].addr;
    }

    /// @notice Returns oracle's internet name.
    function _getInternetName(IterableOraclesData storage self, address owner)
        internal
        view
        returns (bool found, string memory)
    {
        if (self._indexes[owner] == 0) {
            return (false, "");
        }
        return (true, self._values[self._indexes[owner] - 1].url);
    }
}
