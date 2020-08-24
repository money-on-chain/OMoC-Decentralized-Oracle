// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Governed} from "../moc-gobernanza/Governance/Governed.sol";
import {IGovernor} from "../moc-gobernanza/Governance/IGovernor.sol";

/**
  @title GovernedAbstract
  @notice Base contract to be inherited by governed contracts
  @dev This contract is not usable on its own since it does not have any _productive useful_ behaviour
  The only purpose of this contract is to define some useful modifiers and functions to be used on the
  governance aspect of the child contract.
  This contract add the posibility to do a delegate call to any change contract so it can change anything in the
  storage.
  */
contract GovernedAbstract is Governed {

    function delegateCallToChanger(bytes memory data) public onlyAuthorizedChanger() {
        address changerContrat = msg.sender;
        (bool success,) = changerContrat.delegatecall(abi.encodeWithSignature("impersonate(bytes)", data));
        require(success, "Error in delegate call");
    }
}
