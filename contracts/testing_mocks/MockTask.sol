// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ITask} from "../interfaces/ITask.sol";

contract MockTask is ITask {
    bool public shouldRun;
    uint256 public runCount;

    constructor(bool _shouldRun) public {
        shouldRun = _shouldRun;
    }

    function setShouldRun(bool _shouldRun) external {
        shouldRun = _shouldRun;
    }

    function checkTask() external view override returns (bool) {
        return shouldRun;
    }

    function runTask() external override {
        runCount = runCount + 1;
    }
}
