pragma solidity 0.6.0;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {CoinPairPriceGobernanza} from "../CoinPairPriceGobernanza.sol";
import {GovernedAbstract} from "../GovernedAbstract.sol";

/**
  @title CoinPairPriceRoundLockPeriodInBlocksChange
  @notice This contract is a ChangeContract intended to be used to change the coinpairprice contract
  parameter roundLockPeriodInBlocks
 */
contract CoinPairPriceRoundLockPeriodInBlocksChange is CoinPairPriceGobernanza, ChangeContract {

    GovernedAbstract public coinPairPrice;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _roundLockPeriodInBlocks The maximum count of oracles selected to participate each round
    */
    constructor(GovernedAbstract _coinPairPrice, uint256 _roundLockPeriodInBlocks) public {
        coinPairPrice = _coinPairPrice;
        encodedData = abi.encode(_roundLockPeriodInBlocks);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        coinPairPrice.delegateCallToChanger(encodedData);
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        roundLockPeriodInBlocks = abi.decode(data, (uint256));
    }
}
