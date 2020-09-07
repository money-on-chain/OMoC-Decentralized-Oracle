// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Staking} from "../Staking.sol";

contract MockVotingMachine {
    using SafeMath for uint256;

    Staking public staking;

    /// @notice Construct this contract.
    /// @param _staking the Staking contract address.
    function initialize(Staking _staking) external {
        staking = _staking;
    }

    /// @notice Lock an amount of MOCs.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 untilTimestamp) external {
        staking.lockMocs(mocHolder, untilTimestamp);
    }
}
