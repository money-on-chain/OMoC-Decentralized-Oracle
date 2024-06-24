// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerPairChangeList is ChangeContract {
    OracleManager public oracleManager;
    bytes32[] public coinPair;
    address[] public contractAddr;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _coinPair The list of coinpairs to register
      @param _contractAddr The list of coinpairs contract implementation addresses
    */
    constructor(
        OracleManager _oracleManager,
        bytes32[] memory _coinPair,
        address[] memory _contractAddr
    ) public {
        require(_coinPair.length != 0, "coinPair list must have at least one element");
        require(
            _coinPair.length == _contractAddr.length,
            "coinPair and contractAddr list must have same length"
        );
        oracleManager = _oracleManager;
        coinPair = _coinPair;
        contractAddr = _contractAddr;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        for (uint256 i = 0; i < coinPair.length; i++) {
            oracleManager.registerCoinPair(coinPair[i], contractAddr[i]);
        }
        // TODO: Make it usable just once.
    }
}
