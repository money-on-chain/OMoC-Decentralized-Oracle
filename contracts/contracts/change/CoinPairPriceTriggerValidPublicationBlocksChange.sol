pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../CoinPairPriceGobernanza.sol";

/**
  @title CoinPairPriceTriggerValidPublicationBlocksChange
  @notice This contract is a ChangeContract intended to be used to change the coinpairprice contract
  parameter triggerValidPublicationBlocks
 */
contract CoinPairPriceTriggerValidPublicationBlocksChange is ChangeContract {

    CoinPairPriceGobernanza public coinPairPrice;
    uint256 triggerValidPublicationBlocks;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _triggerValidPublicationBlocks The period in which the publication is definitely to be made before price expiration
    */
    constructor(CoinPairPriceGobernanza _coinPairPrice, uint256 _triggerValidPublicationBlocks) public {
        coinPairPrice = _coinPairPrice;
        triggerValidPublicationBlocks = _triggerValidPublicationBlocks;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        coinPairPrice.setTriggerValidPublicationBlocks(triggerValidPublicationBlocks);
        //        // usable just once!!!
        //        coinPairPrice = address(0);
    }

}
