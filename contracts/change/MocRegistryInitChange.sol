// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import { ChangeContract } from "@moc/periphery/moc-governance/Governance/ChangeContract.sol";
import { IRegistry } from "@moc/periphery/IRegistry.sol";
import { RegistryConstants } from "@moc/periphery/RegistryConstants.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryInitChange is ChangeContract, RegistryConstants {
    IRegistry public registry;
    address public delayMachine;
    address public oracleManager;
    address public supporters;
    address public infoGetter;

    /**
      @notice Constructor
    */
    constructor(
        IRegistry _registry,
        address _delayMachine,
        address _oracleManager,
        address _supporters,
    ) public {
        registry = _registry;
        delayMachine = _delayMachine;
        oracleManager = _oracleManager;
        supporters = _supporters;
        infoGetter = _infoGetter;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        require(address(registry) != address(0), "Use once");

        registry.setAddress(MOC_DELAY_MACHINE, delayMachine);
        registry.setAddress(ORACLE_MANAGER_ADDR, oracleManager);
        registry.setAddress(SUPPORTERS_ADDR, supporters);
        registry.setAddress(INFO_ADDR, infoGetter);

        registry.setUint(ORACLE_PRICE_FETCH_RATE, 5);
        registry.setUint(ORACLE_BLOCKCHAIN_INFO_INTERVAL, 3);
        registry.setUint(ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL, 5);
        registry.setUint(ORACLE_GATHER_SIGNATURE_TIMEOUT, 60);
        registry.setUint(ORACLE_MAIN_EXECUTOR_TASK_INTERVAL, 20);
        registry.setUint(ORACLE_PRICE_DIGITS, 18);
        registry.setUint(ORACLE_QUEUE_LEN, 30);
        registry.setUint(MESSAGE_VERSION, 3);
        registry.setUint(ORACLE_PRICE_PUBLISH_BLOCKS, 0);

        // usable just once!!!
        registry = IRegistry(0);
    }
}
