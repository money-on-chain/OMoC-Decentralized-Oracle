// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SubscribedOraclesLib} from "../libs/SubscribedOraclesLib.sol";

/*
    Test for subscribed oracles library.
*/
contract SubscribedOraclesMock {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;

    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    constructor() public {
        subscribedOracles = SubscribedOraclesLib.init();
    }

    function add(address oracle) public returns (bool) {
        return subscribedOracles.add(oracle);
    }

    function remove(address oracle) public returns (bool) {
        return subscribedOracles.remove(oracle);
    }

    function contains(address oracle) public view returns (bool) {
        return subscribedOracles.contains(oracle);
    }

    function at(uint256 index) public view returns (address) {
        return subscribedOracles.at(index);
    }

    function length() public view returns (uint256) {
        return subscribedOracles.length();
    }
}
