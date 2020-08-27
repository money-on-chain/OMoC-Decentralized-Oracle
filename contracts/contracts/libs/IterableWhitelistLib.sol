// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {AddressSetLib} from "./AddressSetLib.sol";

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
        require(
            msg.sender == address(1) || IterableWhitelistLib._isWhitelisted(self, msg.sender),
            "Address is not whitelisted"
        );
        _;
    }

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier onlyWhitelisted(IterableWhitelistLib.IterableWhitelistData storage self) {
        require(
            IterableWhitelistLib._isWhitelisted(self, msg.sender),
            "Address is not whitelisted"
        );
        _;
    }
}

library IterableWhitelistLib {
    using AddressSetLib for AddressSetLib.AddressSet;

    struct IterableWhitelistData {
        AddressSetLib.AddressSet _inner;
    }

    /**
     * @dev Check if an account is whitelisted
     * @return Bool
     */
    function _isWhitelisted(IterableWhitelistData storage self, address account)
        internal
        view
        returns (bool)
    {
        require(account != address(0), "Account must not be 0x0");
        return self._inner.contains(account);
    }

    /**
     * @dev Add account to whitelist
     */
    function _addToWhitelist(IterableWhitelistData storage self, address account) internal {
        require(account != address(0), "Account must not be 0x0");
        bool added = self._inner.add(account);
        require(added, "Account already whitelisted");
    }

    /**
     * @dev Remove account to whitelist
     */
    function _removeFromWhitelist(IterableWhitelistData storage self, address account) internal {
        require(account != address(0), "Account must not be 0x0");
        bool removed = self._inner.remove(account);
        require(removed, "Missing account");
    }

    /// @notice Returns the count of whitelisted addresses.
    function _getWhiteListLen(IterableWhitelistData storage self) internal view returns (uint256) {
        return self._inner.length();
    }

    /// @notice Returns the address at index.
    /// @param idx index to query.
    function _getWhiteListAtIndex(IterableWhitelistData storage self, uint256 idx)
        internal
        view
        returns (address)
    {
        return self._inner.at(idx);
    }
}
