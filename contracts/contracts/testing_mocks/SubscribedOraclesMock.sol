// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SubscribedOraclesLib} from "../libs/SubscribedOraclesLib.sol";

/*
    Test for subscribed oracles library.
*/
contract SubscribedOraclesMock {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;

    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    mapping(address => uint256) stakes;

    uint256 public maxSubscribedOraclesPerRound;

    constructor(uint256 _maxSubscribedOraclesPerRound) public {
        maxSubscribedOraclesPerRound = _maxSubscribedOraclesPerRound;
        subscribedOracles = SubscribedOraclesLib.init();
    }

    function addOrReplace(address oracle, uint256 stake) public {
        if (subscribedOracles.length() < maxSubscribedOraclesPerRound) {
            subscribedOracles.add(oracle);
            setStake(oracle, stake);
            return;
        }
        (uint256 minStake, address minVal) = subscribedOracles.getMin(this.getStake);
        if (stake > minStake) {
            if (subscribedOracles.remove(minVal)) {
                subscribedOracles.add(oracle);
                setStake(oracle, stake);
            }
        }
    }

    function getMin() public view returns (uint256 minStake, address minVal) {
        return subscribedOracles.getMin(this.getStake);
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

    function sortForGas(uint256 count) public returns (address[] memory) {
        maxSubscribedOraclesPerRound = maxSubscribedOraclesPerRound;
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
