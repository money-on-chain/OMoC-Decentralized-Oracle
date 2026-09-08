// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

interface IPayloadTask {
    function checkTask(bytes calldata payload) external view returns (bool);

    function runTask(bytes calldata payload) external;
}
