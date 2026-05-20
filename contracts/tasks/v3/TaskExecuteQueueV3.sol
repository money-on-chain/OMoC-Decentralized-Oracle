// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocMultiCollateralGuard } from "@moc/moc-main/contracts/multiCollateral/MocMultiCollateralGuard.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";
import { Utils } from "../Utils.sol";

/**
 * @title TaskExecuteQueueV3
 * @notice This contract implements a task that executes the MocQueue.
 */
contract TaskExecuteQueueV3 is ITask {
    error InvalidPACtpPrice();
    error TaskNotAvailable();

    MocMultiCollateralGuard public immutable mocMultiCollateralGuard;

    /**
     * @notice Constructor
     * @param mocMultiCollateralGuard_ The address of the MocMultiCollateralGuard contract.
     */
    constructor(address payable mocMultiCollateralGuard_) {
        mocMultiCollateralGuard = MocMultiCollateralGuard(mocMultiCollateralGuard_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() public view returns (bool) {
        MocMultiCollateralGuard mocMC = mocMultiCollateralGuard;
        if (mocMC.paused() || !_areValidAllBucketPrices(mocMC)) return false;
        return (mocMC.readyToExecute());
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocMultiCollateralGuard.execute();
    }

    /**
     * @notice returns true if all PACtps are valid
     * @param mocMultiCollateralGuard_ The MocMultiCollateralGuard contract
     * @dev This function checks all PACtps in all buckets to ensure their price providers
     *  are valid.
     */
    function _areValidAllBucketPrices(MocMultiCollateralGuard mocMultiCollateralGuard_) internal view returns (bool) {
        uint256 bucketsLength = mocMultiCollateralGuard_.getBucketAmount();
        for (uint256 i = 0; i < bucketsLength; i++) {
            MocOperations bucket = mocMultiCollateralGuard_.buckets(i);
            bool areValidPrices = Utils._areValidPrices(address(bucket));
            if (!areValidPrices) return false;
        }
        return true;
    }

    /**
     * @notice returns true if all PACtps are valid
     */
    function areValidAllBucketPrices() external view returns (bool) {
        return _areValidAllBucketPrices(mocMultiCollateralGuard);
    }
}
