// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {AddressSetLib} from "./AddressSetLib.sol";

// prettier-ignore
import {EnumerableSet} from "@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol";
import "../OracleManager.sol";

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
     * @dev Add and replace if the stake of the added address si more than the minimum.
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(SubscribedOracles storage set, address value) internal returns (bool) {
        // TODO: Implement replacement!!!
        return set._inner.add(value);
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
        function(address)  external view returns (uint256) getStake,
        uint256 cant
    ) internal returns (address[] memory ret) {
        set;
        getStake;
        cant;
        return ret;
    }

    // prettier-ignore
    function getMaxUnselectedStake(
        SubscribedOracles storage set,
        function(address)  external view returns (uint256) getStake,
        AddressSetLib.AddressSet storage selectedOracles
    ) internal view returns (address addr, uint256 stake) {
        for (uint256 i = 0; i < selectedOracles.length(); i++) {
            address c = at(set, i);
            if (selectedOracles.contains(c)) {
                continue;
            }
            uint256 s = getStake(c);
            if (s > stake) {
                addr = c;
                stake = s;
            }
        }
        return (addr, stake);
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
