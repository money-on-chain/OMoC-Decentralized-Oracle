// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";

contract TaskMintStep is ITask {
    ICoiner public immutable coiner;

    /**
     * @notice Constructor
     * @param coiner_ The address of the coiner contract.
     */
    constructor(address coiner_) {
        coiner = ICoiner(coiner_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return coiner.readyToMint();
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        coiner.mintStep();
    }
}

interface ICoiner {
    function readyToMint() external view returns (bool);
    function mintStep() external;
}
