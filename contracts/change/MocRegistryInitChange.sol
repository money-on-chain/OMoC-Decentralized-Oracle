// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import { ChangeContract } from "../moc-governance/Governance/ChangeContract.sol";
import { IRegistry } from "../IRegistry.sol";
import { RegistryConstants } from "../RegistryConstants.sol";

interface ITokenReference {
    function getMocToken() external returns (address);
}

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryInitChange is ChangeContract, RegistryConstants {
    IRegistry public registry;
    address public stakingMachine;
    address public vestingMachine;
    address public votingMachine;
    address public delayMachine;
    address public oracleManager;
    address public supporters;
    address public infoGetter;
    address public upgradeDelagator;

    /**
      @notice Constructor
    */
    constructor(
        IRegistry _registry,
        address _stakingMachine,
        address _vestingMachine,
        address _votingMachine,
        address _delayMachine,
        address _oracleManager,
        address _supporters,
        address _infoGetter,
        address _upgradeDelagator
    ) public {
        registry = _registry;
        stakingMachine = _stakingMachine;
        vestingMachine = _vestingMachine;
        votingMachine = _votingMachine;
        delayMachine = _delayMachine;
        oracleManager = _oracleManager;
        supporters = _supporters;
        infoGetter = _infoGetter;
        upgradeDelagator = _upgradeDelagator;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        require(address(registry) != address(0), "Use once");

        // Contracts
        registry.setAddress(MOC_STAKING_MACHINE, stakingMachine);
        registry.setAddress(MOC_VESTING_MACHINE, vestingMachine);
        registry.setAddress(MOC_VOTING_MACHINE, votingMachine);
        registry.setAddress(MOC_DELAY_MACHINE, delayMachine);
        registry.setAddress(ORACLE_MANAGER_ADDR, oracleManager);
        registry.setAddress(SUPPORTERS_ADDR, supporters);
        registry.setAddress(INFO_ADDR, infoGetter);
        registry.setAddress(MOC_UPGRADE_DELEGATOR, upgradeDelagator);
        registry.setAddress(MOC_TOKEN, ITokenReference(stakingMachine).getMocToken());

        // Voting machine parameter keys.
        registry.setUint(MOC_VOTING_MACHINE_MIN_STAKE, 1000000000000000000);
        registry.setUint(MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA, 60 * 60 * 24 * 7);
        registry.setUint(MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS, 10);
        registry.setUint(MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN, 5);
        registry.setUint(MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO, 30);
        registry.setUint(MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM, 20);
        registry.setUint(MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT, 50);
        registry.setUint(MOC_VOTING_MACHINE_PCT_PRECISION, 100);
        registry.setUint(MOC_VOTING_MACHINE_VOTING_TIME_DELTA, 60 * 60 * 24 * 30);

        // Oracles legacy
        registry.setUint(ORACLE_PRICE_FETCH_RATE, 5);
        registry.setUint(ORACLE_BLOCKCHAIN_INFO_INTERVAL, 3);
        registry.setUint(ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL, 5);
        registry.setUint(ORACLE_MAIN_LOOP_TASK_INTERVAL, 60 * 2);
        registry.setDecimal(ORACLE_PRICE_REJECT_DELTA_PCT, 1, -1);
        registry.setUint(ORACLE_CONFIGURATION_TASK_INTERVAL, 60 * 4);
        registry.setUint(ORACLE_GATHER_SIGNATURE_TIMEOUT, 60);
        registry.setUint(ORACLE_MAIN_EXECUTOR_TASK_INTERVAL, 20);
        registry.setUint(SCHEDULER_POOL_DELAY, 60);
        registry.setUint(SCHEDULER_ROUND_DELAY, 60 * 30);
        registry.setUint(ORACLE_PRICE_DIGITS, 18);
        registry.setUint(ORACLE_QUEUE_LEN, 30);
        registry.setUint(MESSAGE_VERSION, 3);
        registry.setDecimal(ORACLE_PRICE_DELTA_PCT, 1, -1);
        registry.setUint(ORACLE_PRICE_PUBLISH_BLOCKS, 0);
        registry.setBytes(ORACLE_ENTERING_FALLBACKS_AMOUNTS, hex"010203060a");
        registry.setUint(ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS, 3);

        // usable just once!!!
        registry = IRegistry(0);
    }
}
