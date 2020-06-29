pragma solidity 0.6.0;

/**
  @dev An iterable mapping of addresses to boolean, used to check if an address is whitelisted.
 */

interface IIterableWhitelist {
    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier whitelistedOrExternal(IterableWhitelistLib.IterableWhitelistData storage self) {
        // We use address(1) to allow calls from outside the block chain to peek
        // The call must use msg.sender == 1 (or { from: 1 }) something that only can be done from
        // outside the blockchain.
        require(msg.sender == address(1) ||
            IterableWhitelistLib._isWhitelisted(self, msg.sender), "Address is not whitelisted");
        _;
    }

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier onlyWhitelisted(IterableWhitelistLib.IterableWhitelistData storage self) {
        require(IterableWhitelistLib._isWhitelisted(self, msg.sender), "Address is not whitelisted");
        _;
    }
}

library IterableWhitelistLib {

    struct IterableWhitelistData {
        address[] keyList;
        mapping(address => bool) whitelist;
    }

    /**
     * @dev Check if an account is whitelisted
     * @return Bool
     */
    function _isWhitelisted(IterableWhitelistData storage self, address account) internal view returns (bool) {
        require(account != address(0), "Account must not be 0x0");
        return self.whitelist[account];
    }


    /**
     * @dev Add account to whitelist
     */
    function _addToWhitelist(IterableWhitelistData storage self, address account) internal {
        if (!_isWhitelisted(self, account)) {
            self.keyList.push(account);
        }
        require(account != address(0), "Account must not be 0x0");
        require(!_isWhitelisted(self, account), "Account not allowed to add accounts into white list");
        self.whitelist[account] = true;
    }

    /**
     * @dev Remove account to whitelist
     */
    function _removeFromWhitelist(IterableWhitelistData storage self, address account, uint256 hint) internal {
        require(account != address(0), "Account must not be 0x0");
        require(hint < self.keyList.length, "Illegal index");
        require(_isWhitelisted(self, account), "Account is not allowed to remove address from the white list");
        self.whitelist[account] = false;
        for (uint256 i = hint; i < self.keyList.length; i++) {
            if (self.keyList[i] == account) {
                self.keyList[i] = self.keyList[self.keyList.length - 1];
                self.keyList.pop();
                break;
            }
        }
    }

    /// @notice Returns the count of whitelisted addresses.
    function _getWhiteListLen(IterableWhitelistData storage self) internal view returns (uint256) {
        return self.keyList.length;
    }

    /// @notice Returns the address at index.
    /// @param idx index to query.
    function _getWhiteListAtIndex(IterableWhitelistData storage self, uint256 idx) internal view returns (address)
    {
        require(idx < self.keyList.length, "Illegal index");
        return self.keyList[idx];
    }
}
