// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {ITask} from '../../../ITask.sol';

/// @notice Opens a rewards period after the Coiner mints directly to the Distributor.
contract TaskRewardsStartPeriod is ITask {
    error TaskNotAvailable();
    error InvalidAddress();

    IRewardsCoiner public immutable coiner;
    IRewardsDistributor public immutable distributor;
    uint256 public lastProcessedRemainingToMint;

    constructor(address coiner_, address distributor_) {
        if (coiner_ == address(0) || distributor_ == address(0)) {
            revert InvalidAddress();
        }
        coiner = IRewardsCoiner(coiner_);
        distributor = IRewardsDistributor(distributor_);
        lastProcessedRemainingToMint = coiner.getRemainingToMint();
    }

    /// @inheritdoc ITask
    function checkTask() external view returns (bool) {
        return _isAvailable();
    }

    /// @inheritdoc ITask
    function runTask() external {
        if (!_isAvailable()) revert TaskNotAvailable();
        lastProcessedRemainingToMint = coiner.getRemainingToMint();
        distributor.startDistributionPeriod();
    }

    function _isAvailable() internal view returns (bool) {
        if (!distributor.canStartDistributionPeriod()) return false;

        uint256 remainingToMint = coiner.getRemainingToMint();
        // After processing the final mint, only the Distributor's schedule matters.
        if (remainingToMint == 0 && lastProcessedRemainingToMint == 0) return true;

        // A decrease identifies a new mint without imposing a processing deadline.
        return remainingToMint < lastProcessedRemainingToMint;
    }
}

interface IRewardsCoiner {
    function getRemainingToMint() external view returns (uint256);
}

interface IRewardsDistributor {
    function canStartDistributionPeriod() external view returns (bool);
    function startDistributionPeriod() external;
}
