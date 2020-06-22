pragma solidity 0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SupportersAbstract} from "./SupportersAbstract.sol";

/*
    Supporters must stop and some time later we let them withdraw.
    Add the functionality to SupportersAbstract.
*/
contract SupportersVestedAbstract is SupportersAbstract {
    event AddStake(address indexed msg_sender, address indexed subacount, address indexed sender, uint256 mocs, uint256 blockNum);
    event Stop(address indexed msg_sender, address indexed user, uint256 blockNum);
    event Withdraw(address indexed msg_sender, address indexed subacount, address indexed receiver, uint256 mocs, uint256 blockNum);

    mapping(address => uint256) stopInBlockMap;

    // The minimum number of blocks that a user must stay staked after staking
    uint256 public minStayBlocks;

    // The period of blocks a user have after a stop and minStayBlock to withdraw
    uint256 public afterStopBlocks;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    /**
    Contract creation

    @param _mocToken MOC token address
    @param _period Number of blocks to distribute earnings, round length
    @param _minStayBlocks The minimum number of blocks that a user must stay staked after staking
    @param _afterStopBlocks The period of blocks a user have after a stop and minStayBlock to withdraw
    */
    function _initialize(IERC20 _mocToken, uint256 _period, uint256 _minStayBlocks, uint256 _afterStopBlocks) internal {
        SupportersAbstract._initialize(_mocToken, _period);
        minStayBlocks = _minStayBlocks;
        afterStopBlocks = _afterStopBlocks;
    }

    /**
      * @dev Sets the minStayBlocks by gobernanza
      * @param _minStayBlocks- the override minStayBlocks
      */
    function _setMinStayBlocks(uint256 _minStayBlocks) internal {
        minStayBlocks = _minStayBlocks;
    }

    /**
      * @dev Sets the afterStopBlocks by gobernanza
      * @param _afterStopBlocks - the override afterStopBlocks
      */
    function _setAfterStopBlocks(uint256 _afterStopBlocks) internal {
        afterStopBlocks = _afterStopBlocks;
    }

    /**
     Stop staking some MOCs
    */
    function _stop(address addr) internal {
        stopInBlockMap[addr] = block.number;
        emit Stop(msg.sender, addr, block.number);
    }


    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function _withdrawFromTo(uint256 _tokens, address _subaccount, address _receiver) override internal returns (uint256) {
        require(stopInBlockMap[_subaccount] != 0, "Must be stopped");
        require(stopInBlockMap[_subaccount] + minStayBlocks < block.number, "Can't withdraw until minStayBlocks");
        require(stopInBlockMap[_subaccount] + minStayBlocks + afterStopBlocks >= block.number, "Must withdraw before afterStopBlocks");

        uint256 mocs = SupportersAbstract._withdrawFromTo(_tokens, _subaccount, _receiver);
        delete stopInBlockMap[_subaccount];
        emit Withdraw(msg.sender, _subaccount, _receiver, mocs, block.number);
        return mocs;
    }

    /// @notice Returns true if a supporter can withdraw his money
    //  @param _subaccount subaccount used to withdraw MOC
    function _canWithdraw(address _subaccount) internal view returns (bool) {
        return ((stopInBlockMap[_subaccount] + minStayBlocks < block.number) &&
        (stopInBlockMap[_subaccount] + minStayBlocks + afterStopBlocks >= block.number));
    }

    /**
      Vesting information for _account.

      @param _account User address
      @return balance the balance of the user
      @return stoppedInblock the block in which the mocs where stopped
    */
    function _vestingInfoOf(address _account) internal view returns (uint256 balance, uint256 stoppedInblock) {
        require(_account != address(0), "Address must be != 0");
        return (SupportersAbstract._getMOCBalanceAt(address(this), _account), stopInBlockMap[_account]);
    }


    /**
    add MOCs to stake

    @param _mocs amount of MOC to stake
    @param _subacount sub account in which we deposit
    @param _sender source account from which we must take funds
    */
    function _stakeAtFrom(uint256 _mocs, address _subacount, address _sender) override internal {
        SupportersAbstract._stakeAtFrom(_mocs, _subacount, _sender);
        delete stopInBlockMap[_sender];
        emit AddStake(msg.sender, _subacount, _sender, _mocs, block.number);
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
