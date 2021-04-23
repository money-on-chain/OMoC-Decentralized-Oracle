// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";
import {CoinPairPrice} from "../CoinPairPrice.sol";
import {PriceProviderRegister} from "../PriceProviderRegister.sol";
import {IPriceProviderRegisterEntry} from "@money-on-chain/omoc-sc-shared/contracts/IPriceProviderRegisterEntry.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract PriceProviderOracleManagerRegisterPairChange is ChangeContract {
    PriceProviderRegister public priceProviderRegister;
    OracleManager public oracleManager;

    /**
      @notice Constructor
      @param _priceProviderRegister Address of register contract used to register the coin pairs
      @param _oracleManager Oracle manager, used to register all the coinpairs
    */
    constructor(PriceProviderRegister _priceProviderRegister, OracleManager _oracleManager) public {
        priceProviderRegister = _priceProviderRegister;
        oracleManager = _oracleManager;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only redefine
      the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        uint256 coinPairCount = oracleManager.getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            bytes32 coinPair = oracleManager.getCoinPairAtIndex(i);
            address contractAddr = oracleManager.getContractAddress(coinPair);
            priceProviderRegister.registerCoinPair(
                coinPair,
                IPriceProviderRegisterEntry(contractAddr)
            );
        }
        // TODO: Make it usable just once.;
    }
}
