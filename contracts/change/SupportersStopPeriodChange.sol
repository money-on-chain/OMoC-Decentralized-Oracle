// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {SupportersStorage} from "../SupportersStorage.sol";

/**
  @title SupportersPeriodChange
  @notice This contract is a ChangeContract intended to be used to change the Supporters contract
  It closes the round so we can rotate it immediately.
 */
contract SupportersStopPeriodChange is SupportersStorage, ChangeContract {
    Governed public supporters;

    /**
      @notice Constructor
      @param _supporters Address of supporters whitelisted contract to upgrade
    */
    constructor(Governed _supporters) public {
        supporters = _supporters;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        supporters.delegateCallToChanger("");
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata _data) external {
        _data;
        uint256 notDistributed = supportersData._getLockedAt(block.number);
        // Setting earnings to zero stops the distribution of rewards
        supportersData.earnings = 0;
        // By substracting what we still need to distribute we send the funds to the next round
        supportersData.mocBalance = supportersData.mocBalance.sub(notDistributed);
        // Now we start a new period.
        supportersData.endEarnings = block.number;
        // At this point without a call to distribute the contract doesn't distribute any rewards
        // No matter how much is deposited in the contracts address.
    }
}
