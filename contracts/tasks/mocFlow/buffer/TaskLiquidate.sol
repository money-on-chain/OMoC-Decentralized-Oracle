// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";

contract TaskLiquidate is ITask {
    IBuffer public immutable buffer;
    uint256 public immutable points;

    /**
     * @notice Constructor
     * @param buffer_ The address of the buffer contract.
     * @param points_ The points awarded for running this task.
     */
    constructor(address buffer_, uint256 points_) {
        buffer = IBuffer(buffer_);
        points = points_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return buffer.isLiquidable();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external returns (uint256) {
        buffer.liquidate();
        return points;
    }
}

interface IBuffer {
    function isLiquidable() external view returns (bool);
    function liquidate() external;
}
