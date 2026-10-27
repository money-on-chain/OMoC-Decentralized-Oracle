// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";

contract TaskTriggerOrder is ITask {
    error TaskNotAvailable();

    IReverseAuction public immutable reverseAuction;
    uint256 public lastRevertTimestamp;
    /// @notice Consecutive trigger errors recorded outside backoff; reset after a successful execution.
    uint256 public errorCount;
    uint256 public immutable BASE_SLEEP_TIME;
    uint256 public immutable MAX_REVERT_SLEEP_TIME;

    event TriggerOrdersReverted(string reason, bytes data);

    /**
     * @notice Constructor
     * @dev A zero base or maximum disables the retry delay.
     * @param reverseAuction_ The address of the reverse auction contract.
     * @param baseRevertSleepTime_ The initial delay in seconds
     * @param maxRevertSleepTime_ The maximum delay in seconds
     */
    constructor(address reverseAuction_, uint256 baseRevertSleepTime_, uint256 maxRevertSleepTime_) {
        reverseAuction = IReverseAuction(reverseAuction_);
        BASE_SLEEP_TIME = baseRevertSleepTime_;
        MAX_REVERT_SLEEP_TIME = maxRevertSleepTime_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() public view returns (bool) {
        bool backoffComplete = errorCount == 0 || block.timestamp - lastRevertTimestamp >= currentRevertSleepTime();
        return backoffComplete && reverseAuction.readyToTriggerOrders();
    }

    /// @notice Current retry delay: min(BASE_SLEEP_TIME * 2**(errorCount - 1), MAX_REVERT_SLEEP_TIME).
    function currentRevertSleepTime() public view returns (uint256) {
        if (errorCount == 0 || BASE_SLEEP_TIME == 0) return 0;
        uint256 exponent = errorCount - 1;
        // Right shifts of 256 bits or more yield zero, so this also handles large error counts.
        if (BASE_SLEEP_TIME > (MAX_REVERT_SLEEP_TIME >> exponent)) {
            return MAX_REVERT_SLEEP_TIME;
        }
        return BASE_SLEEP_TIME << exponent;
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        try reverseAuction.triggerOrders() {
            errorCount = 0;
            lastRevertTimestamp = 0;
        } catch Error(string memory reason) {
            _recordError();
            emit TriggerOrdersReverted(reason, "");
        } catch (bytes memory data) {
            _recordError();
            emit TriggerOrdersReverted("", data);
        }
    }

    function _recordError() private {
        // Keep attempts callable without letting failures during backoff extend the wait.
        if (errorCount != 0 && block.timestamp - lastRevertTimestamp < currentRevertSleepTime()) return;

        ++errorCount;
        lastRevertTimestamp = block.timestamp;
    }
}

interface IReverseAuction {
    function readyToTriggerOrders() external view returns (bool);
    function triggerOrders() external;
}
