// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Supporters} from "../Supporters.sol";
import {Staking} from "../Staking.sol";

contract StakingMock {
    using SafeMath for uint256;

    Staking public staking;
    Supporters public supporters;

    /// @notice Construct this contract.
    /// @param _staking the Staking contract address.
    /// @param _supporters the Supporters contract contract address.
    function initialize(Staking _staking, Supporters _supporters) external {
        staking = _staking;
        supporters = _supporters;
    }

    /// @notice Reports the balance of internal tokens for a specific user.
    function getBalanceInTokens(address user) external view returns (uint256) {
        return supporters.getBalanceAt(address(staking), user);
    }
}
