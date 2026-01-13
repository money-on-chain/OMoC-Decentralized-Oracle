// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ITask} from "../interfaces/ITask.sol";

contract MockRevertingTask is ITask {
    function checkTask() external view override returns (bool) {
        revert("checkTask reverted");
    }

    function runTask() external override returns (uint256) {
        return 0;
    }
}
