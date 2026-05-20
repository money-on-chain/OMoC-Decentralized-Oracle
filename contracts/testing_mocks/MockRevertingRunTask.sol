// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ITask} from "../interfaces/ITask.sol";

contract MockRevertingRunTask is ITask {
    function checkTask() external view override returns (bool) {
        return true;
    }

    function runTask() external override returns (uint256) {
        revert("MockRevertingRunTask: runTask reverted");
    }
}
