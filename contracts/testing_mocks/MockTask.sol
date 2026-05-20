// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ITask} from "../interfaces/ITask.sol";

contract MockTask is ITask {
    bool public shouldRun;
    uint256 public pointsToAward;
    uint256 public runCount;

    constructor(bool _shouldRun, uint256 _pointsToAward) public {
        shouldRun = _shouldRun;
        pointsToAward = _pointsToAward;
    }

    function setShouldRun(bool _shouldRun) external {
        shouldRun = _shouldRun;
    }

    function setPointsToAward(uint256 _pointsToAward) external {
        pointsToAward = _pointsToAward;
    }

    function checkTask() external view override returns (bool) {
        return shouldRun;
    }

    function runTask() external override returns (uint256) {
        runCount = runCount + 1;
        return pointsToAward;
    }
}
