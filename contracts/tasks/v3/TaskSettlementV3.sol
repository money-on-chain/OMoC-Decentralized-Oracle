// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";
import { Utils } from "../Utils.sol";

/**
 * @title TaskSettlementV3
 * @notice This contract implements a task that executes settlement for the Moc contract.
 */
contract TaskSettlementV3 is ITask {
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
        bool areValidPrices = Utils._areValidPrices(address(bucket_));
        if (bucket_.paused() || !areValidPrices) return false;
        return (block.timestamp >= bucket_.nextSettlementTime());
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        bucket.execSettlement();
    }
}
