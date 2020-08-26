pragma solidity 0.6.0;

/**
  @dev An iterable mapping of addresses to Oracle struct, used to check oracles' data.
 */

library IterableOraclesLib {

    struct Oracle {
        address addr;
        string url;
        bool registered;
    }

    struct IterableOraclesData {
        address[] ownerList;
        mapping(address => Oracle) registeredOracles;
    }

    function initRegisteredOracles() internal returns (IterableOraclesData memory) {
        address[] memory ownerList;
        return IterableOraclesData(ownerList);
    }

    /**
     * @dev Check if an oracle is registered
     * @return Bool
     */
    function _isOracleRegistered(IterableOraclesData storage self, address owner) internal view returns (bool) {
        require(owner != address(0), "Owner address cannot be 0x0");
        return self.registeredOracles[owner].registered;
    }

    /**
     * @dev Register oracle
     */
    function _registerOracle(IterableOraclesData storage self, address owner, address oracle, string memory url) internal {
        if (!_isOracleRegistered(self, owner)) {
            self.ownerList.push(owner);
        }
        require(owner != address(0), "Owner address cannot be 0x0");
        require(!_isOracleRegistered(self, owner), "Oracle not allowed to be registered if it's already registered");
        self.registeredOracles[owner].addr = oracle;
        self.registeredOracles[owner].url = url;
        self.registeredOracles[owner].registered = true;
    }

    /**
     * @dev Remove account to whitelist
     */
    function _removeOracle(IterableOraclesData storage self, address owner, uint256 hint) internal {
        require(owner != address(0), "Owner address cannot be 0x0");
        require(hint < self.ownerList.length, "Illegal index");
        require(_isOracleRegistered(self, owner), "Oracle not allowed to be removed if it's not registered");
        self.registeredOracles[owner].registered = false;
        for (uint256 i = hint; i < self.ownerList.length; i++) {
            if (self.ownerList[i] == owner) {
                self.ownerList[i] = self.ownerList[self.ownerList.length - 1];
                self.ownerList.pop();
                break;
            }
        }
    }

    /// @notice Returns the count of whitelisted addresses.
    function _getOwnerListLen(IterableOraclesData storage self) internal view returns (uint256) {
        return self.ownerList.length;
    }

    /// @notice Returns the owner address at index.
    /// @param idx index to query.
    function _getOwnerAtIndex(IterableOraclesData storage self, uint256 idx) internal view returns (address)
    {
        require(idx < self.ownerList.length, "Illegal index");
        return self.ownerList[idx];
    }

    /// @notice Returns true if it's the oracle's owner.
    function _isOwner(IterableOraclesData storage self, address ownerAddr, address oracleAddr) internal view returns (bool) {
        return self.registeredOracles[ownerAddr].addr == oracleAddr;
    }

    /// @notice Returns address of oracle's owner.
    function _getOwner(IterableOraclesData storage self, address oracleAddr) internal view returns (address) {
        for (uint256 i = 0; i < self.ownerList.length; i++) {
            if (self.registeredOracles[self.ownerList[i]].addr == oracleAddr) {
                return self.ownerList[i];
            }
        }
        return address(0);
    }

    /// @notice Sets oracle's name.
    function _setName(IterableOraclesData storage self, address ownerAddr, string memory url) internal {
        self.registeredOracles[ownerAddr].url = url;
    }
}
