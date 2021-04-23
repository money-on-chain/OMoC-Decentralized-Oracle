// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {IMintableERC20} from "@money-on-chain/omoc-sc-shared/contracts/IMintableERC20.sol";

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract TestMOCMintChange is ChangeContract {
    IMintableERC20 public token;
    address public user;
    uint256 public amount;

    /**
      @notice Constructor
    */
    constructor(
        IMintableERC20 _token,
        address _user,
        uint256 _amount
    ) public {
        token = _token;
        user = _user;
        amount = _amount;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        token.mint(user, amount);
    }
}
