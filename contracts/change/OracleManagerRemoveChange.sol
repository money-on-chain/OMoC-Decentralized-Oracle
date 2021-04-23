// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerRemoveChange is ChangeContract {
    OracleManager public oracleManager;
    address public oracleOwner;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _oracleOwner The owner of the Oracle
    */
    constructor(OracleManager _oracleManager, address _oracleOwner) public {
        oracleManager = _oracleManager;
        oracleOwner = _oracleOwner;
    }

    /**
      @notice Execute the changes.
      */
    function execute() external override {
        oracleManager.removeOracle(oracleOwner);
        oracleManager = OracleManager(0);
    }
}
