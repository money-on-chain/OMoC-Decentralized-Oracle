// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";
import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TaskRefreshACBalanceV3
 * @notice This contract implements a task that refreshes the AC balance in the Moc contract.
 */
contract TaskRefreshACBalanceV3 is ITask {
    error TaskNotAvailable();

    MocOperations public immutable moc;
    uint256 public immutable balanceThreshold;

    /**
     * @notice Constructor
     * @param moc_ The address of the Moc contract.
     * @param balanceThreshold_ The threshold for the unaccounted AC balance to trigger the task.
     */
    constructor(address moc_, uint256 balanceThreshold_) {
        moc = MocOperations(moc_);
        balanceThreshold = balanceThreshold_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() public view returns (bool) {
        MocOperations mocOp = moc;
        address acToken = mocOp.acToken();
        uint256 unaccountedAcBalance = IERC20(acToken).balanceOf(address(mocOp)) -
            mocOp.nACcb() -
            mocOp.qACLockedInPending();
        return (unaccountedAcBalance > balanceThreshold);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        moc.refreshACBalance();
    }
}
