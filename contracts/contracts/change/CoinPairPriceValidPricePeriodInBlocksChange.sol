pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../CoinPairPriceGobernanza.sol";

/**
  @title CoinPairPriceValidPricePeriodInBlocksChange
  @notice This contract is a ChangeContract intended to be used to change the coinpairprice contract
  parameter validPricePeriodInBlocks
 */
contract CoinPairPriceValidPricePeriodInBlocksChange is ChangeContract {

    CoinPairPriceGobernanza public coinPairPrice;
    uint256 validPricePeriodInBlocks;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _validPricePeriodInBlocks The period in which the price is valid after a publication
    */
    constructor(CoinPairPriceGobernanza _coinPairPrice, uint256 _validPricePeriodInBlocks) public {
        coinPairPrice = _coinPairPrice;
        validPricePeriodInBlocks = _validPricePeriodInBlocks;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        coinPairPrice.setValidPricePeriodInBlocks(validPricePeriodInBlocks);
        //        // usable just once!!!
        //        coinPairPrice = address(0);
    }

}
