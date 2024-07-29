// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {OracleManagerStorage} from "../OracleManagerStorage.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerPairChangeListRemove is OracleManagerStorage, ChangeContract {
    OracleManager public oracleManager_;
    bytes32[] public coinPairsToRemove;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _coinPairsToRemove The list of coinpairs contract implementation addresses to remove
    */
    constructor(OracleManager _oracleManager, bytes32[] memory _coinPairsToRemove) public {
        oracleManager_ = _oracleManager;
        coinPairsToRemove = _coinPairsToRemove;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        if (coinPairsToRemove.length > 0) {
            for (uint256 i = 0; i < coinPairsToRemove.length; i++) {
                oracleManager_.delegateCallToChanger(abi.encode(coinPairsToRemove[i]));
            }
        }
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        coinPairRegisterData._unRegisterCoinPair(abi.decode(data, (bytes32)), 0);
    }
}
