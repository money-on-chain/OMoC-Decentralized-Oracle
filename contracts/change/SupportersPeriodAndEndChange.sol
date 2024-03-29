// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {SupportersStorage} from "../SupportersStorage.sol";

/**
  @title SupportersPeriodChange
  @notice This contract is a ChangeContract intended to be used to change the Supporters contract
  parameter period
 */
contract SupportersPeriodAndEndChange is SupportersStorage, ChangeContract {
    Governed public supporters;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _supporters Address of supporters whitelisted contract to upgrade
      @param _period The length of the round in blocks
    */
    constructor(
        Governed _supporters,
        uint256 _period,
        uint256 _end
    ) public {
        supporters = _supporters;
        encodedData = abi.encode(_period, _end);
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
        (supportersData.period, supportersData.endEarnings) = abi.decode(data, (uint256, uint256));
    }
}
