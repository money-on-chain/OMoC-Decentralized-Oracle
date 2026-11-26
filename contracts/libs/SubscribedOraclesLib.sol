// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {AddressSetLib} from "@moc/periphery/contracts/lib/AddressSetLib.sol";

/**
  @notice Based on EnumberableSet, but with the ability to clear all the contents.
 */
library SubscribedOraclesLib {
    using AddressSetLib for AddressSetLib.AddressSet;

    /// Global registration information for each oracle, used by OracleManager
    struct SubscribedOracles {
        AddressSetLib.AddressSet _inner;
    }

    function init() internal pure returns (SubscribedOracles memory) {
        return SubscribedOracles({_inner: AddressSetLib.init()});
    }

    /**
     * @dev Removes all value from a set. O(N).
     *
     */
    function clear(SubscribedOracles storage set) internal {
        set._inner.clear();
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(SubscribedOracles storage set, address value) internal returns (bool) {
        return set._inner.add(value);
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(SubscribedOracles storage set, address value) internal returns (bool) {
        return set._inner.remove(value);
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(SubscribedOracles storage set, address value) internal view returns (bool) {
        return set._inner.contains(value);
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(SubscribedOracles storage set) internal view returns (uint256) {
        return set._inner.length();
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(SubscribedOracles storage set, uint256 index) internal view returns (address) {
        return set._inner.at(index);
    }

    /**
     * @dev Returns the set contents as an array
     */
    function asArray(SubscribedOracles storage set)
        internal
        view
        returns (address[] memory selectedOracles)
    {
        return set._inner.asArray();
    }
}
