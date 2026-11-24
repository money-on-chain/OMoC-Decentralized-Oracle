// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

/// @notice Write-only interface to the existing Distributor.
interface IRewardsDistributor {
    function publishEpoch(
        uint256 newEpoch,
        bytes32 newRoot,
        string calldata newCid,
        uint256 snapshotBlock,
        uint256 distributedToday
    ) external;
}
