// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocMultiCollateralGuard } from "@moc/moc-main/contracts/multiCollateral/MocMultiCollateralGuard.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";

/**
 * @title TaskEvalLiquidationV3
 * @notice This contract implements a task that evaluates if liquidation is needed and runs it if so.
 */
contract TaskExecuteLiquidationV3 is ITask {
    error TaskNotAvailable();

    MocMultiCollateralGuard public immutable mocMultiCollateralGuard;
    MocOperations public immutable bucket;
    uint256 public immutable points;
    /**
     * @notice Constructor
     * @param mocMultiCollateralGuard_ The address of the MocMultiCollateralGuard contract.
     * @param bucket_ The address of the MocOperations contract.
     * @param points_ The points awarded for running this task.
     */
    constructor(address payable mocMultiCollateralGuard_, address bucket_, uint256 points_) {
        mocMultiCollateralGuard = MocMultiCollateralGuard(mocMultiCollateralGuard_);
        bucket = MocOperations(bucket_);
        points = points_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        MocMultiCollateralGuard mocMC = mocMultiCollateralGuard;
        if (mocMC.paused()) return false;
        return mocMC.isLiquidationAvailable(bucket);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external returns (uint256) {
        mocMultiCollateralGuard.execLiquidation(bucket);
        return points;
    }
}
