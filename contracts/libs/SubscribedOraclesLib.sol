// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {AddressSetLib} from "@money-on-chain/omoc-sc-shared/contracts/lib/AddressSetLib.sol";

/**
  @notice Based on EnumberableSet, but with the ability to clear all the contents.
 */
library SubscribedOraclesLib {
    using SafeMath for uint256;
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
     * @dev Get the minimum value.
     *
     */
    // prettier-ignore
    function getMin(
        SubscribedOracles storage set,
        function(address) external view returns (uint256) getStake
    ) internal view returns (uint256 minStake, address minVal) {
        if (length(set) == 0) {
            return (0, address(0));
        }
        minVal = at(set, 0);
        minStake = getStake(minVal);
        for (uint256 i = 1; i < length(set); i++) {
            address v = at(set, i);
            uint256 s = getStake(v);
            if (s < minStake) {
                minStake = s;
                minVal = v;
            }
        }
        return (minStake, minVal);
    }

    /**
     * @dev return a list of indexes that sorts the set by stake.
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    // prettier-ignore
    function sort(
        SubscribedOracles storage set,
        function(address) external view returns (uint256) getStake,
        uint256 count
    ) internal view returns (address[] memory selected) {
        if (count > length(set)) {
            count = length(set);
        }
        selected = new address[](count);
        if (count == 0) {
            return selected;
        }
        selected[0] = at(set, 0);
        for (uint256 i = 1; i < length(set); i++) {
            address v = at(set, i);
            uint256 vStake = getStake(v);
            uint256 j = i;
            if (j >= count) {
                j = count - 1;
                if (vStake <= getStake(selected[j])) {
                    continue;
                }
            }
            while (j > 0 && vStake > getStake(selected[j - 1])) {
                selected[j] = selected[j - 1];
                j--;
            }
            selected[j] = v;
        }
        return selected;
    }

    // prettier-ignore
    function getMaxUnselectedStake(
        SubscribedOracles storage set,
        function(address[] memory) external view returns (address, uint256) getMaxStake,
        AddressSetLib.AddressSet storage selectedOracles
    ) internal view returns (address, uint256) {
        uint256 len = length(set);
        address[] memory unselected = new address[](len);
        uint256 j = 0;
        for (uint256 i = 0; i < len; i++) {
            address c = at(set, i);
            if (selectedOracles.contains(c)) {
                continue;
            }
            unselected[j] = c;
            j += 1;
        }
        return getMaxStake(unselected);
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
