// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {StakingStorage} from "../StakingStorage.sol";

/**
  @title StakingWithdrawLockTimeChange
  @notice This contract is a ChangeContract intended to be used to change the Staking contract
  parameter WithdrawLockTimeChange
 */
contract StakingWithdrawLockTimeChange is StakingStorage, ChangeContract {
    Governed public staking;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _staking Address of staking contract to upgrade
      @param _withdrawLockTime A fixed amount of lock time that is added to withdraws
    */
    constructor(Governed _staking, uint256 _withdrawLockTime) public {
        staking = _staking;
        encodedData = abi.encode(_withdrawLockTime);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        staking.delegateCallToChanger(encodedData);
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        withdrawLockTime = abi.decode(data, (uint256));
    }
}
