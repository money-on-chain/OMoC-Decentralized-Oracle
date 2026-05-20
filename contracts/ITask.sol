// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

interface ITask {
    /**
     * @notice Checks if the task can be executed.
     * @return bool indicating if the task can be executed
     */
    function checkTask() external view returns (bool);

    /**
     * @notice Executes the task.
     */
    function runTask() external;
}
