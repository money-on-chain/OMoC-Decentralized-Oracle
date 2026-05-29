// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../ITask.sol";

/**
 * @title TaskDistributeSupporters
 * @notice This contract implements a task that distributes earnings to supporters.
 */
contract TaskDistributeSupporters is ITask {
    ISupporters public immutable supporters;

    /**
     * @notice Constructor
     * @param supporters_ The address of the Supporters contract.
     */
    constructor(address supporters_) {
        supporters = ISupporters(supporters_);
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return (supporters.isReadyToDistribute());
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external {
        supporters.distribute();
    }
}

interface ISupporters {
    /**
      @notice Deposit earnings that will be credited to supporters.
      @dev Earnings will be credited periodically through several blocks.
    */
    function distribute() external;

    /**
      @notice Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool);
}
