// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {IPayloadTask} from '../interfaces/IPayloadTask.sol';

contract MockPayloadTask is IPayloadTask {
    bool public shouldRun;
    bool public shouldRevert;
    uint256 public runCount;
    bytes32 public lastPayloadHash;

    constructor(bool _shouldRun, bool _shouldRevert) public {
        shouldRun = _shouldRun;
        shouldRevert = _shouldRevert;
    }

    function setShouldRun(bool _shouldRun) external {
        shouldRun = _shouldRun;
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function checkTask(bytes calldata) external view override returns (bool) {
        return shouldRun;
    }

    function runTask(bytes calldata payload) external override {
        require(!shouldRevert, 'MockPayloadTask: runTask reverted');
        runCount = runCount + 1;
        lastPayloadHash = keccak256(payload);
    }
}
