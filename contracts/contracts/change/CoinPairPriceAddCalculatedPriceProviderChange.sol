pragma solidity 0.6.0;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {CoinPairPriceGobernanza} from "../CoinPairPriceGobernanza.sol";
import {CalculatedPriceProvider} from "../CalculatedPriceProvider.sol";

/**
  @title CoinPairPriceAddCoinPairCalculatorChange
  @notice This contract is a ChangeContract intended to be used to whitelist a coinPairPriceCalculator
  in various CoinPaiPrice contracts at once.
 */
contract CoinPairPriceAddCalculatedPriceProviderChange is ChangeContract {

    CalculatedPriceProvider calculatedPriceProvider;
    CoinPairPriceGobernanza[] coinPairPrices;
    /**
      @notice Constructor
      @param _calculatedPriceProvider Address of coin pair price calculator to add to whitelists
      @param _coinPairPrices List of coinPairPrice contracts that must whitelist the _coinPairPriceCalculator Address
    */
    constructor(CalculatedPriceProvider _calculatedPriceProvider, CoinPairPriceGobernanza[] memory _coinPairPrices) public {
        calculatedPriceProvider = _calculatedPriceProvider;
        coinPairPrices = _coinPairPrices;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        for (uint i = 0; i < coinPairPrices.length; i++) {
            coinPairPrices[i].addToWhitelist(address(calculatedPriceProvider));
        }
        //        // usable just once!!!
        //        coinPairPrice = address(0);
    }

}
