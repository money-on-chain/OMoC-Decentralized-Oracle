// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";

/**
 * @title TaskSettlementV1
 * @notice This contract implements a task that runs settlement for the Moc contract.
 */
contract TaskSettlementV1 is ITask {
    uint256 public constant STEPS = 20;
    IMocV1 public immutable mocV1;

    /**
     * @notice Constructor
     * @param mocV1_ The address of the Moc contract.
     */
    constructor(address mocV1_) {
        mocV1 = IMocV1(mocV1_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        IMocV1 moc = mocV1;
        if (moc.paused()) return false;
        return moc.isSettlementEnabled();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocV1.runSettlement(STEPS);
    }
}

interface IMocV1 {
    function paused() external view returns (bool);
    function isSettlementEnabled() external view returns (bool);
    function runSettlement(uint256 steps) external;
}
