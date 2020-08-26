// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {OracleRoundInfoLib} from "./OracleRoundInfoLib.sol";
// prettier-ignore
import {EnumerableSet} from "@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol";

/**
  @notice Based on EnumberableSet, but with the ability to clear all the contents.
 */
library SelectedOraclesLib {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// Global registration information for each oracle, used by OracleManager
    struct SelectedOracles {
        EnumerableSet.AddressSet _inner;
    }

    function init() internal pure returns (SelectedOracles memory) {
        return SelectedOracles(EnumerableSet.AddressSet(EnumerableSet.Set(new bytes32[](0))));
    }

    /**
     * @dev Removes all value from a set. O(N).
     *
     */
    function clear(SelectedOracles storage set) internal {
        for (uint256 i = 0; i < set._inner._inner._values.length; i++) {
            delete set._inner._inner._indexes[set._inner._inner._values[i]];
        }
        delete set._inner._inner._values;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(SelectedOracles storage set, address value) internal returns (bool) {
        return set._inner.add(value);
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(SelectedOracles storage set, address value) internal returns (bool) {
        return set._inner.remove(value);
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(SelectedOracles storage set, address value) internal view returns (bool) {
        return set._inner.contains(value);
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(SelectedOracles storage set) internal view returns (uint256) {
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
    function at(SelectedOracles storage set, uint256 index) internal view returns (address) {
        return set._inner.at(index);
    }

    /**
     * @dev Returns the set contents as an array
     */
    function asArray(SelectedOracles storage set)
        internal
        view
        returns (address[] memory selectedOracles)
    {
        selectedOracles = new address[](length(set));
        for (uint256 i = 0; i < length(set); i++) {
            selectedOracles[i] = at(set, i);
        }
    }
}
