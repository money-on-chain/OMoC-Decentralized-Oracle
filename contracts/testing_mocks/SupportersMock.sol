// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {SupportersLib} from "../libs/SupportersLib.sol";

/*
    Original supporter contract that has no restrictions.
*/
contract SupportersMock is Initializable {
    SupportersLib.SupportersData internal supportersData;
    using SupportersLib for SupportersLib.SupportersData;

    // Emitted by SupportersLib
    event PayEarnings(uint256 earnings, uint256 start, uint256 end);
    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);
    event AddStake(
        address indexed user,
        address indexed subaccount,
        address indexed sender,
        uint256 amount,
        uint256 mocs
    );
    event WithdrawStake(
        address indexed user,
        address indexed subaccount,
        address indexed destination,
        uint256 amount,
        uint256 mocs
    );

    function initialize(IERC20 _mocToken, uint256 _period) external initializer {
        supportersData._initialize(_mocToken, _period);
    }

    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
    */
    function distribute() external {
        supportersData._distribute();
    }

    /**
      Stake MOC to receive earnings.

      @param _mocs amount of MOC to stake
    */
    function stake(uint256 _mocs) external {
        supportersData._stakeAtFrom(_mocs, msg.sender, msg.sender);
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
    */
    function stakeAt(uint256 _mocs, address _subaccount) external {
        supportersData._stakeAtFrom(_mocs, _subaccount, msg.sender);
    }

    /**
      Withdraw MOC for tokens.

      @param _tokens amount of tokens to convert to MOC
      @return Amount of MOC transfered
    */
    function withdraw(uint256 _tokens) external returns (uint256) {
        return supportersData._withdrawFromTo(_tokens, msg.sender, msg.sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @return Amount of MOC transfered
    */
    function withdrawFrom(uint256 _tokens, address _subaccount) external returns (uint256) {
        return supportersData._withdrawFromTo(_tokens, _subaccount, msg.sender);
    }

    /**
      Amount of tokens for _user.

      @param _user User address
      @return tokens for _user
    */
    function getBalance(address _user) external view returns (uint256) {
        return supportersData._getBalanceAt(_user, _user);
    }

    /**
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function getBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersData._getBalanceAt(_user, _subaccount);
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @return MOC for _user
    */
    function getMOCBalance(address _user) external view returns (uint256) {
        return supportersData._getMOCBalanceAt(_user, _user);
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersData._getMOCBalanceAt(_user, _subaccount);
    }

    /**
      Total tokens created.

      @return total amount of tokens
    */
    function getTokens() external view returns (uint256) {
        return supportersData._getTokens();
    }

    /**
      MOC available for withdrawal.

      @return total amount of MOC
    */
    function getAvailableMOC() external view returns (uint256) {
        return supportersData._getAvailableMOC();
    }

    /**
      Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view returns (uint256) {
        return supportersData._getEarningsAt(_block);
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function getLockedAt(uint256 _block) external view returns (uint256) {
        return supportersData._getLockedAt(_block);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function getEarningsInfo()
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return supportersData._getEarningsInfo();
    }

    /**
      @return The moc token address
    */
    function mocToken() external view returns (IERC20) {
        return supportersData.mocToken;
    }
}
