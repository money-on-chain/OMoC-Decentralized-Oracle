// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/periphery/contracts/moc-governance/Governance/ChangeContract.sol";

/// @notice Generic test-only ChangeContract that executes an arbitrary call on a target contract.
contract MockCallChange is ChangeContract {
    address public target;
    bytes public callData;

    constructor(address _target, bytes memory _callData) public {
        target = _target;
        callData = _callData;
    }

    function execute() external override {
        (bool success, bytes memory returndata) = target.call(callData);
        if (!success) {
            assembly {
                revert(add(returndata, 32), mload(returndata))
            }
        }
    }
}
