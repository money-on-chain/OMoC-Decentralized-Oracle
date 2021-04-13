// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {OracleManagerStorage} from "../OracleManagerStorage.sol";

/**
  @title OracleManagerOracleMinStakeChange
  @notice This contract is a ChangeContract intended to be used to change ..
 */
contract OracleManagerOracleMinStakeChange is OracleManagerStorage, ChangeContract {
    Governed public oracle_manager;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _oracle_manager Address of supporters whitelisted contract to upgrade
      @param _period The length of the round in blocks
    */
    constructor(Governed _oracle_manager, uint256 _period) public {
        oracle_manager = _oracle_manager;
        encodedData = abi.encode(_period);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        oracle_manager.delegateCallToChanger(encodedData);
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        minCPSubscriptionStake = abi.decode(data, (uint256));
    }
}
