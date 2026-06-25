// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";

/**
 * @title TaskInterestPaymentV3
 * @notice This contract implements a task that pays interest from TC holders.
 */
contract TaskInterestPaymentV3 is ITask {
    MocOperations public immutable bucket;

    /**
     * @notice Constructor
     * @param bucket_ The address of the MocOperations contract.
     */
    constructor(address bucket_) {
        bucket = MocOperations(bucket_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        MocOperations bucket_ = bucket;
        if (bucket_.paused() || bucket_.liquidated()) return false;
        return block.timestamp >= bucket_.nextTCInterestPayment();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        bucket.tcHoldersInterestPayment();
    }
}
