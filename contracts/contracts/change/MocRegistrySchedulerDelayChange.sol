pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../EternalStorageGobernanza.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistrySchedulerDelayChange is ChangeContract {

    EternalStorageGobernanza public registry;

    /**
      @notice Constructor
    */
    constructor(EternalStorageGobernanza _registry) public
    {
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
        // usable just once!!!
        // registry = EternalStorageGobernanza(0);
    }

    function get_keccak(string memory k) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("MOC_ORACLE\\1\\", k));
    }
}
