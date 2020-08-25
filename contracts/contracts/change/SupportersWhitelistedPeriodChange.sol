// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {GovernedAbstract} from "../libs/GovernedAbstract.sol";
import {SupportersWhitelistedStorage} from "../SupportersWhitelistedStorage.sol";

/**
  @title SupportersWhitelistedPeriodChange
  @notice This contract is a ChangeContract intended to be used to change the SupportersWhitelisted contract
  parameter period
 */
contract SupportersWhitelistedPeriodChange is SupportersWhitelistedStorage, ChangeContract {
    GovernedAbstract public supporters;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _supporters Address of supporters whitelisted contract to upgrade
      @param _period The length of the round in blocks
    */
    constructor(GovernedAbstract _supporters, uint256 _period) public {
        supporters = _supporters;
        encodedData = abi.encode(_period);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        supporters.delegateCallToChanger(encodedData);
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        supportersData.period = abi.decode(data, (uint256));
    }
}
