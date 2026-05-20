// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocMultiCollateralGuard } from "@moc/moc-main/contracts/multiCollateral/MocMultiCollateralGuard.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";

/**
 * @title TaskExecuteMicroLiquidationV3
 * @notice This contract implements a task that evaluates if micro-liquidation is needed and runs it if so.
 */
contract TaskExecuteMicroLiquidationV3 is ITask {
    error TaskNotAvailable();

    MocMultiCollateralGuard public immutable mocMultiCollateralGuard;
    MocOperations public immutable bucket;

    /**
     * @notice Constructor
     * @param mocMultiCollateralGuard_ The address of the MocMultiCollateralGuard contract.
     * @param bucket_ The address of the MocOperations contract.
     */
    constructor(address payable mocMultiCollateralGuard_, address bucket_) {
        mocMultiCollateralGuard = MocMultiCollateralGuard(mocMultiCollateralGuard_);
        bucket = MocOperations(bucket_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        MocMultiCollateralGuard mocMC = mocMultiCollateralGuard;
        if (mocMC.paused()) return false;
        return mocMC.isMicroLiquidationAvailable(bucket);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocMultiCollateralGuard.execMicroLiquidation(bucket);
    }
}
