pragma solidity 0.6.0;

import {IERC20} from "../openzeppelin/token/ERC20/IERC20.sol";
import {SupportersLib} from "./SupportersLib.sol";

/*
    Supporters must stop and some time later we let them withdraw.
    Add the functionality to SupportersAbstract.
*/
library SupportersVestedLib {
    struct SupportersVestedData {
        SupportersLib.SupportersData supportersData;
        mapping(address => uint256) stopInBlockMap;

        // The minimum number of blocks that a user must stay staked after staking
        uint256 minStayBlocks;

        // The period of blocks a user have after a stop and minStayBlock to withdraw
        uint256 afterStopBlocks;
    }
    using SupportersLib for SupportersLib.SupportersData;

    event AddStake(address indexed msg_sender, address indexed subacount,
        address indexed sender, uint256 mocs, uint256 blockNum);
    event Stop(address indexed msg_sender, address indexed user, uint256 blockNum);
    event Withdraw(address indexed msg_sender, address indexed subacount,
        address indexed receiver, uint256 mocs, uint256 blockNum);


    /**
    Contract creation

    @param _mocToken MOC token address
    @param _period Number of blocks to distribute earnings, round length
    @param _minStayBlocks The minimum number of blocks that a user must stay staked after staking
    @param _afterStopBlocks The period of blocks a user have after a stop and minStayBlock to withdraw
    */
    function _initialize(SupportersVestedData storage self, IERC20 _mocToken, uint256 _period,
        uint256 _minStayBlocks, uint256 _afterStopBlocks)
    internal {
        self.supportersData._initialize(_mocToken, _period);
        self.minStayBlocks = _minStayBlocks;
        self.afterStopBlocks = _afterStopBlocks;
    }


    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function _withdrawFromTo(SupportersVestedData storage self, uint256 _tokens,
        address _subaccount, address _receiver)
    internal returns (uint256) {
        require(self.stopInBlockMap[_subaccount] != 0, "Must be stopped");
        require(self.stopInBlockMap[_subaccount] + self.minStayBlocks < block.number,
            "Can't withdraw until minStayBlocks");
        require(self.stopInBlockMap[_subaccount] + self.minStayBlocks + self.afterStopBlocks >= block.number,
            "Must withdraw before afterStopBlocks");

        uint256 mocs = self.supportersData._withdrawFromTo(_tokens, _subaccount, _receiver);
        delete self.stopInBlockMap[_subaccount];
        emit Withdraw(msg.sender, _subaccount, _receiver, mocs, block.number);
        return mocs;
    }

    /// @notice Returns true if a supporter can withdraw his money
    //  @param _subaccount subaccount used to withdraw MOC
    function _canWithdraw(SupportersVestedData storage self, address _subaccount) internal view returns (bool) {
        return ((self.stopInBlockMap[_subaccount] + self.minStayBlocks < block.number) &&
        (self.stopInBlockMap[_subaccount] + self.minStayBlocks + self.afterStopBlocks >= block.number));
    }

    /**
      Vesting information for _account.

      @param _account User address
      @return balance the balance of the user
      @return stoppedInblock the block in which the mocs where stopped
    */
    function _vestingInfoOf(SupportersVestedData storage self, address _account)
    internal view returns (uint256 balance, uint256 stoppedInblock) {
        require(_account != address(0), "Address must be != 0");
        return (self.supportersData._getMOCBalanceAt(address(this), _account), self.stopInBlockMap[_account]);
    }


    /**
    add MOCs to stake

    @param _mocs amount of MOC to stake
    @param _subacount sub account in which we deposit
    @param _sender source account from which we must take funds
    */
    function _stakeAtFrom(SupportersVestedData storage self, uint256 _mocs, address _subacount, address _sender)
    internal {
        self.supportersData._stakeAtFrom(_mocs, _subacount, _sender);
        delete self.stopInBlockMap[_sender];
        emit AddStake(msg.sender, _subacount, _sender, _mocs, block.number);
    }
}
