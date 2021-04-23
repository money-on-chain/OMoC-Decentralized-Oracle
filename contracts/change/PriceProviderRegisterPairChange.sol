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
contract PriceProviderRegisterPairChange is ChangeContract {
    PriceProviderRegister public priceProviderRegister;
    bytes32 public coinPair;
    IPriceProviderRegisterEntry public contractAddr;

    /**
      @notice Constructor
      @param _priceProviderRegister Address of register contract used to register the coin pairs
      @param _coinPair Coinpair to register
      @param _contractAddr Address to register
    */
    constructor(
        PriceProviderRegister _priceProviderRegister,
        bytes32 _coinPair,
        IPriceProviderRegisterEntry _contractAddr
    ) public {
        priceProviderRegister = _priceProviderRegister;
        coinPair = _coinPair;
        contractAddr = _contractAddr;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only redefine
      the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        priceProviderRegister.registerCoinPair(coinPair, contractAddr);
        // OVERRIDE THE OLD ONE !!!
        // priceProviderRegister.setCoinPair(coinPair,contractAddr);
        // TODO: Make it usable just once.
    }
}
