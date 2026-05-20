// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";

contract TaskLiquidate is ITask {
    IBuffer public immutable buffer;

    /**
     * @notice Constructor
     * @param buffer_ The address of the buffer contract.
     */
    constructor(address buffer_) {
        buffer = IBuffer(buffer_);
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
    function runTask() external {
        buffer.liquidate();
    }
}

interface IBuffer {
    function isLiquidable() external view returns (bool);
    function liquidate() external;
}
