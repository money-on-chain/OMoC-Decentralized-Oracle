// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract TaskTriggerOrder is ITask, Ownable {
    error TaskNotAvailable();

    IReverseAuction public immutable reverseAuction;
    uint256 public revertSleepTime;
    uint256 public lastRevertTimestamp;

    event TriggerOrdersReverted(string reason, bytes data);

    /**
     * @notice Constructor
     * @param reverseAuction_ The address of the reverse auction contract.
     * @param revertSleepTime_ The delay in seconds applied after a revert.
     * @param owner_ The address allowed to update revertSleepTime.
     */
    constructor(address reverseAuction_, uint256 revertSleepTime_, address owner_) Ownable() {
        reverseAuction = IReverseAuction(reverseAuction_);
        revertSleepTime = revertSleepTime_;
        _transferOwnership(owner_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() public view returns (bool) {
        bool backoffComplete = lastRevertTimestamp == 0 || block.timestamp >= lastRevertTimestamp + revertSleepTime;
        return backoffComplete && reverseAuction.readyToTriggerOrders();
    }

    function setRevertSleepTime(uint256 revertSleepTime_) external onlyOwner {
        revertSleepTime = revertSleepTime_;
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        try reverseAuction.triggerOrders() {} catch Error(string memory reason) {
            lastRevertTimestamp = block.timestamp;
            emit TriggerOrdersReverted(reason, "");
        } catch (bytes memory data) {
            lastRevertTimestamp = block.timestamp;
            emit TriggerOrdersReverted("", data);
        }
    }
}

interface IReverseAuction {
    function readyToTriggerOrders() external view returns (bool);
    function triggerOrders() external;
}
