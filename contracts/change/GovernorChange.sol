// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/IGovernor.sol";

/**
  @title GobernorChange
  @notice This contract is a ChangeContract intended to change the gobernor of all the gobernable contracts
 */
contract GovernorChange is ChangeContract {
    IGovernor public newGovernor;
    Governed[] public governed;

    /**
      @notice Constructor
      @param _newGovernor New governor address
      @param _governed The list of addresses of the governed contracts
    */
    constructor(IGovernor _newGovernor, Governed[] memory _governed) public {
        newGovernor = _newGovernor;
        governed = _governed;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        require(newGovernor != IGovernor(0), "New governor address must be != 0");
        for (uint256 i = 0; i < governed.length; i++) {
            governed[i].changeIGovernor(newGovernor);
        }
        // Usable just once.
        newGovernor = IGovernor(0);
    }
}
