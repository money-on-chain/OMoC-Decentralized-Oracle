// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

interface IPayloadTask {
    function checkTask(bytes calldata payload) external view returns (bool);

    function runTask(bytes calldata payload) external;
}
