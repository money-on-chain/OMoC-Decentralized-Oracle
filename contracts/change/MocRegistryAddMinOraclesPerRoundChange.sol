// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {RegistryConstants} from "@moc/shared/contracts/RegistryConstants.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryAddMinOraclesPerRoundChange is ChangeContract, RegistryConstants {
    IRegistry public registry;
    address public delayMachine;
    address public oracleManager;
    address public supporters;
    address public infoGetter;

    /**
      @notice Constructor
    */
    constructor(IRegistry _registry) public {
        registry = _registry;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        require(address(registry) != address(0), "Use once");

        registry.setUint(ORACLE_MIN_ORACLES_PER_ROUND, 3);
        // usable just once!!!
        registry = IRegistry(0);
    }
}
