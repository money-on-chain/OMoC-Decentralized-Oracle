// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

interface ITask {
    /**
     * @notice Checks if the task can be executed.
     * @return bool indicating if the task can be executed
     */
    function checkTask() external view returns (bool);

    /**
     * @notice Executes the task and returns points earned.
     * @return uint256 points earned from executing the task
     */
    function runTask() external returns (uint256);
}
