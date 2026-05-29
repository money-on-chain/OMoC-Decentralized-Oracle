// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { Utils } from "../Utils.sol";

/**
 * @title TaskUpdateEmaV1
 * @notice This contract implements a task that updates the Bitcoin moving average.
 */
contract TaskUpdateEmaV1 is ITask {
    IMocStateV1 public immutable mocStateV1;

    /**
     * @notice Constructor
     * @param mocStateV1_ The address of the MocState contract.
     */
    constructor(address mocStateV1_) {
        mocStateV1 = IMocStateV1(mocStateV1_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        if (!Utils._isValidPrice((mocStateV1.getBtcPriceProvider()))) return false;
        return mocStateV1.shouldCalculateEma();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocStateV1.calculateBitcoinMovingAverage();
    }
}

interface IMocStateV1 {
    function getBtcPriceProvider() external view returns (address);
    function shouldCalculateEma() external view returns (bool);
    function calculateBitcoinMovingAverage() external;
}