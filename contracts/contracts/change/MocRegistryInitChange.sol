pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../EternalStorageGobernanza.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryInitChange is ChangeContract {

    EternalStorageGobernanza public registry;
    address public oracle_manager;
    address public supporters_vested;


    /**
      @notice Constructor
    */
    constructor(EternalStorageGobernanza _registry, address _oracle_manager, address _supporters_vested) public {
        registry = _registry;
        oracle_manager = _oracle_manager;
        supporters_vested = _supporters_vested;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        require(address(registry) != address(0), "Use once");

        registry.setAddress(get_keccak("ORACLE_MANAGER_ADDR"), oracle_manager);
        registry.setAddress(get_keccak("SUPPORTERS_VESTED_ADDR"), supporters_vested);

        registry.setUint(get_keccak("ORACLE_PRICE_FETCH_RATE"), 5);
        registry.setUint(get_keccak("ORACLE_BLOCKCHAIN_INFO_INTERVAL"), 3);
        registry.setUint(get_keccak("ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL"), 5);
        registry.setUint(get_keccak("ORACLE_MAIN_LOOP_TASK_INTERVAL"), 120);
        registry.setDecimal(get_keccak("ORACLE_PRICE_REJECT_DELTA_PCT"), 5, 1);
        registry.setUint(get_keccak("ORACLE_CONFIGURATION_TASK_INTERVAL"), 240);
        registry.setUint(get_keccak("ORACLE_GATHER_SIGNATURE_TIMEOUT"), 60);
        registry.setUint(get_keccak("SCHEDULER_POOL_DELAY"), 10);
        registry.setUint(get_keccak("SCHEDULER_ROUND_DELAY"), 60 * 60 * 24);
        registry.setUint(get_keccak("ORACLE_PRICE_DIGITS"), 18);
        registry.setUint(get_keccak("ORACLE_QUEUE_LEN"), 30);
        registry.setUint(get_keccak("MESSAGE_VERSION"), 3);
        registry.setUint(get_keccak("ORACLE_STAKE_LIMIT_MULTIPLICATOR"), 2);
        registry.setDecimal(get_keccak("ORACLE_PRICE_FALLBACK_DELTA_PCT"), 5, - 2);
        registry.setUint(get_keccak("ORACLE_PRICE_PUBLISH_BLOCKS"), 0);
        registry.setUint(get_keccak("ORACLE_PRICE_FALLBACK_BLOCKS"), 1);
        // usable just once!!!
        registry = EternalStorageGobernanza(0);
    }

    function get_keccak(string memory k) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("MOC_ORACLE\\1\\", k));
    }
}