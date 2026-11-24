// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IRewardsDistributor} from '../interfaces/IRewardsDistributor.sol';

/// @dev Deliberately has no state getters: the publisher can only publish.
contract MockRewardsDistributor is IRewardsDistributor {
    address private operator;
    bool private rejectPublication;
    uint256 private currentEpoch;

    event PublicationReceived(
        uint256 epoch,
        bytes32 root,
        string cid,
        uint256 snapshotBlock,
        uint256 amount
    );

    function setOperator(address _operator) external {
        operator = _operator;
    }
    function setRejectPublication(bool _reject) external {
        rejectPublication = _reject;
    }

    function publishEpoch(
        uint256 epoch,
        bytes32 root,
        string calldata cid,
        uint256 snapshotBlock,
        uint256 amount
    ) external override {
        require(msg.sender == operator, 'Not operator');
        require(!rejectPublication, 'Publication rejected');
        require(epoch == currentEpoch + 1, 'Invalid epoch');
        currentEpoch = epoch;
        emit PublicationReceived(epoch, root, cid, snapshotBlock, amount);
    }
}
