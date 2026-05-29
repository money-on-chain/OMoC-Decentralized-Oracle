// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";

/**
 * @title TaskEvalLiquidationV1
 * @notice This contract implements a task that evaluates if liquidation is needed and runs it if so.
 */
contract TaskEvalLiquidationV1 is ITask {
    IMocV1 public immutable mocV1;
    IMocStateV1 public immutable mocStateV1;

    /**
     * @notice Constructor
     * @param mocV1_ The address of the Moc contract.
     * @param mocStateV1_ The address of the MocState contract.
     */
    constructor(address mocV1_, address mocStateV1_) {
        mocV1 = IMocV1(mocV1_);
        mocStateV1 = IMocStateV1(mocStateV1_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return mocStateV1.isLiquidationReached();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocV1.evalLiquidation();
    }
}

interface IMocV1 {
    function evalLiquidation() external;
}

interface IMocStateV1 {
    function isLiquidationReached() external view returns (bool);
}