// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {IPayloadTask} from '../../IPayloadTask.sol';
import {MocLendingManager} from '@moc/lending/contracts/MocLendingManager.sol';

/**
 * @title LendingLiquidationTask
 * @notice Executes liquidations for one immutable lending market.
 * @dev The only payload accepted is the canonical abi.encode(user) representation.
 */
contract LendingLiquidationTask is IPayloadTask {
    error InvalidAddress();
    error InvalidPayloadLength();

    MocLendingManager public immutable manager;
    address public immutable tpToken;
    address public immutable mocBucket;

    constructor(address payable manager_, address tpToken_, address mocBucket_) {
        if (manager_ == address(0) || tpToken_ == address(0) || mocBucket_ == address(0)) {
            revert InvalidAddress();
        }
        manager = MocLendingManager(manager_);
        tpToken = tpToken_;
        mocBucket = mocBucket_;
    }

    function checkTask(bytes calldata payload) external view override returns (bool) {
        return manager.isLiquidationAvailable(_decodeUser(payload), tpToken, mocBucket);
    }

    function runTask(bytes calldata payload) external override {
        manager.liquidate(_decodeUser(payload), tpToken, mocBucket);
    }

    function _decodeUser(bytes calldata payload) private pure returns (address user) {
        if (payload.length != 32) revert InvalidPayloadLength();
        user = abi.decode(payload, (address));
    }
}
