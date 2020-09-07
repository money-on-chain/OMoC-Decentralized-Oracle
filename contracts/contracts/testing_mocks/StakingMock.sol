// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {Supporters} from "../Supporters.sol";
import {Staking} from "../Staking.sol";

contract StakingMock {
    using SafeMath for uint256;

    Staking public staking;
    Supporters public supporters;
    IERC20 public mocToken;

    /// @notice Construct this contract.
    /// @param _staking the Staking contract address.
    /// @param _supporters the Supporters contract contract address.
    function initialize(
        Staking _staking,
        Supporters _supporters
    ) external {
        staking = _staking;
        mocToken = _supporters.mocToken();
        supporters = _supporters;
    }

    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    function deposit(uint256 mocs, address destination) external {
        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(msg.sender, address(this), mocs), "error in transferFrom");
        // Stake at Supporters contract
        require(mocToken.approve(address(staking), mocs), "error in approve");
        staking.deposit(mocs, destination);
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param mocs token quantity
    function withdraw(uint256 mocs) external {
        staking.withdraw(mocs);
    }

    /// @notice Reports the balance of MOCs for a specific user.
    function getBalance() external view returns (uint256) {
        return staking.getBalance(address(this));
    }

    /// @notice Reports the balance of internal tokens for a specific user.
    function getBalanceInTokens() external view returns (uint256) {
        return supporters.getBalanceAt(address(staking), address(this));
    }

    function mocToToken(uint256 mocs) external view returns (uint256) {
        return supporters.mocToToken(mocs);
    }
}