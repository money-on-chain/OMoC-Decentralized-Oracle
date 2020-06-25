pragma solidity 0.6.0;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {CoinPairPriceGobernanza} from "../CoinPairPriceGobernanza.sol";
import {GovernedAbstract} from "../GovernedAbstract.sol";
/**
  @title CoinPairPriceMaxOraclesPerRoundChange
  @notice This contract is a ChangeContract intended to be used to change the coinpairprice contract
  parameter maxOraclesPerRound
 */
contract CoinPairPriceMaxOraclesPerRoundChange is CoinPairPriceGobernanza, ChangeContract {

    GovernedAbstract public coinPairPrice;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    */
    constructor(GovernedAbstract _coinPairPrice, uint256 _maxOraclesPerRound) public {
        coinPairPrice = _coinPairPrice;
        encodedData = abi.encode(_maxOraclesPerRound);
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
        maxOraclesPerRound = abi.decode(data, (uint256));
    }
}
