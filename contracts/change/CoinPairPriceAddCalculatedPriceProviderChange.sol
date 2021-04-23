// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";

//import {IterableWhitelist} from "../libs/IterableWhitelist.sol";

/**
  @title CoinPairPriceAddCoinPairCalculatorChange
  @notice This contract is a ChangeContract intended to be used to whitelist a coinPairPriceCalculator
  in various CoinPaiPrice contracts at once.
 */
contract CoinPairPriceAddCalculatedPriceProviderChange is CoinPairPriceStorage, ChangeContract {
    Governed[] public coinPairPrices;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _calculatedPriceProvider Address of coin pair price calculator to add to whitelists
      @param _coinPairPrices List of coinPairPrice contracts that must whitelist the _coinPairPriceCalculator Address
    */
    constructor(address _calculatedPriceProvider, Governed[] memory _coinPairPrices) public {
        encodedData = abi.encode(_calculatedPriceProvider);
        coinPairPrices = _coinPairPrices;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly
      because it is not its responsability in the current architecture
     */
    function execute() external override {
        for (uint256 i = 0; i < coinPairPrices.length; i++) {
            coinPairPrices[i].delegateCallToChanger(encodedData);
        }
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        pricePeekWhitelistData._addToWhitelist(abi.decode(data, (address)));
    }
}
