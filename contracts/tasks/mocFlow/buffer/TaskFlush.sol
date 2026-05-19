// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";

contract TaskFlush is ITask {
    error TaskNotAvailable();

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
        return (_flushAvailable(buffer) != type(uint256).max);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external returns (uint256) {
        uint256 outputIndex = _flushAvailable(buffer);
        if (outputIndex == type(uint256).max) revert TaskNotAvailable();
        buffer.flush(outputIndex);
        return points;
    }

    /**
     * @dev Checks if there is a output that can run the flush task
     * @param buffer_ The Buffer contract
     * @return outputIndex The output index that can run the task, max uint256 if none are available
     */
    function _flushAvailable(IBuffer buffer_) internal view returns (uint256 outputIndex) {
        uint256 outputsLength = buffer_.getNumOutputs();

        // Check if there are any output that can run the task
        for (uint256 i = 0; i < outputsLength; i++) {
            if (buffer_.isFlushable(i)) {
                return i;
            }
        }
        return type(uint256).max; // Return max uint256 if no flushable output found
    }

    /**
     * @dev Checks if there is a output that can run the flush task
     * @return outputIndex The output index that can run the task, max uint256 if none are available
     */
    function flushAvailable() external view returns (uint256 outputIndex) {
        return _flushAvailable(buffer);
    }
}

interface IBuffer {
    function getNumOutputs() external view returns (uint256);
    function isFlushable(uint256 i) external view returns (bool);
    function flush(uint256 i) external;
}
