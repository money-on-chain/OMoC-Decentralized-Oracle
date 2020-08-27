// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SubscribedOraclesLib} from "../libs/SubscribedOraclesLib.sol";

/*
    Test for subscribed oracles library.
*/
contract TestSubscribedOracles {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;

    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    mapping(address => uint256) stakes;

    constructor() public {
        subscribedOracles = SubscribedOraclesLib.init();
    }

    function add(address oracle, uint256 stake) public {
        subscribedOracles.add(oracle);
        setStake(oracle, stake);
    }

    function remove(address oracle) public {
        subscribedOracles.remove(oracle);
        setStake(oracle, 0);
    }

    function contains(address oracle) public view returns (bool) {
        return subscribedOracles.contains(oracle);
    }

    function sort(uint256 count) public view returns (address[] memory) {
        return subscribedOracles.sort(this.getStake, count);
    }

    function length() public view returns (uint256) {
        return subscribedOracles.length();
    }

    function setStake(address oracle, uint256 stake) public {
        stakes[oracle] = stake;
    }

    function getStake(address oracle) external view returns (uint256) {
        return stakes[oracle];
    }
}
