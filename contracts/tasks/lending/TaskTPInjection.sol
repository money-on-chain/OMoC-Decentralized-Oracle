// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {ITask} from '../../ITask.sol';

/**
 * @title TaskTPInjection
 * @notice Triggers the periodic TP injection for a lending pool.
 */
contract TaskTPInjection is ITask {
    error InvalidAddress();

    IMocLendingManager public immutable lendingManager;
    address public immutable tpToken;

    /**
     * @param lendingManager_ The MocLendingManager that owns the lending pool.
     * @param tpToken_ The TP token identifying the lending pool.
     */
    constructor(address payable lendingManager_, address tpToken_) {
        if (lendingManager_ == address(0) || tpToken_ == address(0)) revert InvalidAddress();
        lendingManager = IMocLendingManager(lendingManager_);
        tpToken = tpToken_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        IMocLendingManager manager = lendingManager;
        if (manager.paused()) return false;

        uint256 nextInjectionTime = manager.getNextInjectionTime(tpToken);
        return block.timestamp >= nextInjectionTime;
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        lendingManager.triggerTPInjection(tpToken);
    }
}

interface IMocLendingManager {
    function paused() external view returns (bool);

    function getNextInjectionTime(address tpToken_) external view returns (uint256);

    function triggerTPInjection(address tpToken_) external;
}
