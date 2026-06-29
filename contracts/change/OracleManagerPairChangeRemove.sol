// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/periphery/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";

/**
  @title OracleManagerPairChangeRemove
  @notice This contract is a ChangeContract intended to be used when
  unregistering a coin pair from the OracleManager.
 */
contract OracleManagerPairChangeRemove is ChangeContract {
    OracleManager public oracleManager;
    bytes32 public coinPair;
    uint256 public hint;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to unregister the coin pair
      @param _coinPair The coinpair to unregister
      @param _hint Optional hint to start traversing the coinPairList array, zero is to search all the array
    */
    constructor(OracleManager _oracleManager, bytes32 _coinPair, uint256 _hint) public {
        oracleManager = _oracleManager;
        coinPair = _coinPair;
        hint = _hint;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        oracleManager.unregisterCoinPair(coinPair, hint);
        // TODO: Make it usable just once.
    }
}
