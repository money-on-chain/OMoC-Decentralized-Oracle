// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";

/**
 * @title TaskInterestPaymentV1
 * @notice This contract implements a task that pays interest from BitPro holders.
 */
contract TaskInterestPaymentV1 is ITask {
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
        return (moc.isBitProInterestEnabled());
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        mocV1.payBitProHoldersInterestPayment();
    }
}

interface IMocV1 {
    function paused() external view returns (bool);
    function isBitProInterestEnabled() external view returns (bool);
    function payBitProHoldersInterestPayment() external;
}
