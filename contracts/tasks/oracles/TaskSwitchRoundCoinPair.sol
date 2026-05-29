// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";

/**
 * @title TaskSwitchRoundCoinPair
 * @notice This contract implements a task that switches the round for a coin pair.
 */
contract TaskSwitchRoundCoinPair is ITask {
    error TaskNotAvailable();
    ICoinPair public immutable coinPair;

    /**
     * @notice Constructor
     * @param coinPair_ The address of the CoinPair contract.
     */
    constructor(address coinPair_) {
        coinPair = ICoinPair(coinPair_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return isReadyToSwitchRound(coinPair);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        coinPair.switchRound();
    }

    /**
     * @notice Check if a coin pair is ready to switch rounds.
     * @param coinPair_ The coin pair to check.
     * @return True if the coin pair is ready to switch rounds, false otherwise.
     */
    function isReadyToSwitchRound(ICoinPair coinPair_) public view returns (bool) {
        (uint256 round, , uint256 lockPeriodTimestamp, , , ) = coinPair_.getRoundInfo();
        return block.timestamp > lockPeriodTimestamp && round != 0;
    }
}

interface ICoinPair {
    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    /// This method search the subscribed list and choose the 10 with more stake.
    function switchRound() external;

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOwners,
            address[] memory selectedOracles
        );
}
