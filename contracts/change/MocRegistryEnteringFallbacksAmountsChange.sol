// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";

/**
    @title MocRegistryEnteringFAllbacksAmountsChange
    @notice This contract is a ChangeContract intended to change some MOC registry values
 */
contract MocRegistryEnteringFallbacksAmountsChange is ChangeContract {
    IRegistry public registry;

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
        registry.setBytes(getKeccak("ORACLE_ENTERING_FALLBACKS_AMOUNTS"), hex"010204");
    }

    function getKeccak(string memory k) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("MOC_ORACLE\\1\\", k));
    }
}
