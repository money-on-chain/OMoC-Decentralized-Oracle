// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {StakingStorage} from "../StakingStorage.sol";

/**
  @title StakingWithdrawLocktimeChange
  @notice This contract is a ChangeContract intended to be used to change the Supporters contract
  parameter period
 */
contract StakingWithdrawLocktimeChange is StakingStorage, ChangeContract {
    Governed public staking;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _staking Address of supporters whitelisted contract to upgrade
      @param _period The expiration time in seconds
    */
    constructor(Governed _staking, uint256 _previous, uint256 _period) public {
        staking = _staking;
        encodedData = abi.encode(_previous, _period);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        staking.delegateCallToChanger(encodedData);
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        uint256 prev;
        uint256 _withdrawLockTime;
        (prev, _withdrawLockTime) = abi.decode(data, (uint256, uint256));
        require(prev==withdrawLockTime, "wrong previous value");
        withdrawLockTime = _withdrawLockTime;
    }
}
