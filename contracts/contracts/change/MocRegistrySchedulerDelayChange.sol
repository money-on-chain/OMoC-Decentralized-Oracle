// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {EternalStorageGobernanza} from "../EternalStorageGobernanza.sol";

/**
    @title MocRegistrySchedulerDelayChange
    @notice This contract is a ChangeContract intended to change some MOC registry values
 */
contract MocRegistrySchedulerDelayChange is ChangeContract {
    EternalStorageGobernanza public registry;

    /**
      @notice Constructor
    */
    constructor(EternalStorageGobernanza _registry) public {
        registry = _registry;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        registry.setUint(get_keccak("SCHEDULER_POOL_DELAY"), 1 * 60);
        registry.setUint(get_keccak("SCHEDULER_ROUND_DELAY"), 30 * 60);
        // TODO: Make it usable just once.
    }

    function get_keccak(string memory k) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("MOC_ORACLE\\1\\", k));
    }
}
