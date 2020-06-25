pragma solidity 0.6.0;
pragma experimental ABIEncoderV2;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {CoinPairPriceGobernanza} from "../CoinPairPriceGobernanza.sol";
import {GovernedAbstract} from "../GovernedAbstract.sol";
import {CalculatedPriceProvider} from "../CalculatedPriceProvider.sol";
import {IterableWhitelist} from "../libs/IterableWhitelist.sol";

/**
  @title CoinPairPriceAddCoinPairCalculatorChange
  @notice This contract is a ChangeContract intended to be used to whitelist a coinPairPriceCalculator
  in various CoinPaiPrice contracts at once.
 */
contract CoinPairPriceAddCalculatedPriceProviderChange is CoinPairPriceGobernanza, ChangeContract {

    GovernedAbstract[] coinPairPrices;
    bytes encodedData;

    /**
      @notice Constructor
      @param _calculatedPriceProvider Address of coin pair price calculator to add to whitelists
      @param _coinPairPrices List of coinPairPrice contracts that must whitelist the _coinPairPriceCalculator Address
    */
    constructor(address _calculatedPriceProvider, GovernedAbstract[] memory _coinPairPrices) public {
        encodedData = abi.encode(_calculatedPriceProvider);
        coinPairPrices = _coinPairPrices;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        for (uint i = 0; i < coinPairPrices.length; i++) {
            coinPairPrices[i].delegateCallToChanger(encodedData);
        }
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        IterableWhitelist.add(abi.decode(data, (address)));
    }
}
