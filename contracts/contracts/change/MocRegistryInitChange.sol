pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../EternalStorageGobernanza.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryInitChange is ChangeContract {

    EternalStorageGobernanza public registry;
    uint256 period;

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
        require(address(registry) != address(0), "Use once");
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_FETCH_RATE"), 5);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_BLOCKCHAIN_INFO_INTERVAL"), 3);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL"), 5);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_MAIN_LOOP_TASK_INTERVAL"), 120);
        registry.setDecimal(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_REJECT_DELTA_PCT"), 5, 1);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_CONFIGURATION_TASK_INTERVAL"), 240);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_GATHER_SIGNATURE_TIMEOUT"), 60);
        registry.setUint(keccak256("MOC_ORACLE\\1\\SCHEDULER_POOL_DELAY"), 10);
        registry.setUint(keccak256("MOC_ORACLE\\1\\SCHEDULER_ROUND_DELAY"), 60 * 60 * 24);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_DIGITS"), 18);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_QUEUE_LEN"), 30);
        registry.setUint(keccak256("MOC_ORACLE\\1\\MESSAGE_VERSION"), 3);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_STAKE_LIMIT_MULTIPLICATOR"), 2);
        registry.setDecimal(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_FALLBACK_DELTA_PCT"), 5, - 2);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_PUBLISH_BLOCKS"), 0);
        registry.setUint(keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_FALLBACK_BLOCKS"), 1);
        // usable just once!!!
        registry = EternalStorageGobernanza(0);
    }

    function getHash(string memory _value) public view returns (bytes32, bytes32) {
        return (keccak256(bytes(_value)), keccak256("MOC_ORACLE\\1\\ORACLE_PRICE_FALLBACK_BLOCKS"));
    }
}
