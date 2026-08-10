// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocMultiCollateralGuard } from "@moc/moc-main/contracts/multiCollateral/MocMultiCollateralGuard.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";
import { MocQueue } from "@moc/moc-main/contracts/queue/MocQueue.sol";
import { Utils } from "../Utils.sol";

/**
 * @title TaskExecuteQueueV3Fallback
 * @notice Executes expired queues when normal price-based queue execution is
 *         unavailable.
 */
contract TaskExecuteQueueV3Fallback is ITask {
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
    function checkTask() external view returns (bool) {
        MocMultiCollateralGuard mocMC = mocMultiCollateralGuard;
        if (mocMC.paused()) return false;
        // We accept that another queue may still contain a non-expired operation
        // with invalid prices, since prices being unavailable for this long is
        // considered an exceptional situation.
        if (_areValidAllBucketPrices(mocMC)) return false;

        uint256 bucketsLength = mocMC.getBucketAmount();
        for (uint256 i = 0; i < bucketsLength; i++) {
            MocOperations bucket = mocMC.buckets(i);
            MocQueue queue = MocQueue(bucket.mocQueue());
            uint256 firstOperId = queue.firstOperId();
            if (firstOperId == queue.operIdCount()) continue;

            (, uint248 queuedBlk) = queue.opersInfo(firstOperId);
            if (block.number - uint256(queuedBlk) > queue.maxOperWaitingBlk()) return true;
        }
        return false;
    }

    /**
     * @notice Returns true when every bucket has valid TP prices.
     */
    function _areValidAllBucketPrices(MocMultiCollateralGuard mocMultiCollateralGuard_)
        internal
        view
        returns (bool)
    {
        uint256 bucketsLength = mocMultiCollateralGuard_.getBucketAmount();
        for (uint256 i = 0; i < bucketsLength; i++) {
            MocOperations bucket = mocMultiCollateralGuard_.buckets(i);
            if (!Utils._areValidPrices(address(bucket))) return false;
        }
        return true;
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocMultiCollateralGuard.execute();
    }
}
