// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "./ChangeContract.sol";

/**
  @title Governor
  @notice Governor interface. This functions should be overwritten to
  enable the comunnication with the rest of the system
  */
interface IGovernor {

    /**
      @notice Function to be called to make the changes in changeContract
      @dev This function should be protected somehow to only execute changes that
      benefit the system. This decision process is independent of this architechture
      therefore is independent of this interface too
      @param changeContract Address of the contract that will execute the changes
     */
    function executeChange(ChangeContract changeContract) external;

    /**
      @notice Function to be called to make the changes in changeContract
      @param _changer Address of the contract that will execute the changes
     */
    function isAuthorizedChanger(address _changer) external view returns (bool);
}
