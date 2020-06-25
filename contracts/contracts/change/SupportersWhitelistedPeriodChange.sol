pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../SupportersWhitelisted.sol";

/**
  @title SupportersWhitelistedPeriodChange
  @notice This contract is a ChangeContract intended to be used to change the SupportersWhitelisted contract
  parameter period
 */
contract SupportersWhitelistedPeriodChange is ChangeContract {

    SupportersWhitelisted public supporters;
    uint256 period;

    /**
      @notice Constructor
      @param _supporters Address of supporters whitelisted contract to upgrade
      @param _period The length of the round in blocks
    */
    constructor(SupportersWhitelisted _supporters, uint256 _period) public {
        supporters = _supporters;
        period = _period;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
     */
    function execute() external override {
        supporters.setPeriod(period);
        // TODO: Make it usable just once.
    }

}
