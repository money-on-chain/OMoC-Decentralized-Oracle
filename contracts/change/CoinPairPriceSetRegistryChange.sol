// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IRegistry} from "@money-on-chain/omoc-sc-shared/contracts/IRegistry.sol";

/**
  @title CoinPairPriceAddCoinPairCalculatorChange
  @notice This contract is a ChangeContract intended to be used to whitelist a coinPairPriceCalculator
  in various CoinPaiPrice contracts at once.
 */
contract CoinPairPriceSetRegistryChange is CoinPairPriceStorage, ChangeContract {
    Governed public coinPairPrice;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _coinPairPrice CoinPairPrice contract that must set registry address
      @param _registryAddress Address of coin pair price calculator to add to whitelists
    */
    constructor(Governed _coinPairPrice, address _registryAddress) public {
        coinPairPrice = _coinPairPrice;
        encodedData = abi.encode(_registryAddress);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly
      because it is not its responsibility in the current architecture
     */
    function execute() external override {
        coinPairPrice.delegateCallToChanger(encodedData);
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        registry = IRegistry(abi.decode(data, (address)));
    }
}
