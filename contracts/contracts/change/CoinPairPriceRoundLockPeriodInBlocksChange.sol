pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../CoinPairPriceGobernanza.sol";

/**
  @title CoinPairPriceRoundLockPeriodInBlocksChange
  @notice This contract is a ChangeContract intended to be used to change the coinpairprice contract
  parameter roundLockPeriodInBlocks
 */
contract CoinPairPriceRoundLockPeriodInBlocksChange is ChangeContract {

    CoinPairPriceGobernanza public coinPairPrice;
    uint256 roundLockPeriodInBlocks;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _roundLockPeriodInBlocks The maximum count of oracles selected to participate each round
    */
    constructor(CoinPairPriceGobernanza _coinPairPrice, uint256 _roundLockPeriodInBlocks) public {
        coinPairPrice = _coinPairPrice;
        roundLockPeriodInBlocks = _roundLockPeriodInBlocks;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        coinPairPrice.setRoundLockPeriodInBlocks(roundLockPeriodInBlocks);
        //        // usable just once!!!
        //        coinPairPrice = address(0);
    }

}
