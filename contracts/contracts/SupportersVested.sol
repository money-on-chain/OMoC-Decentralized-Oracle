pragma solidity ^0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import "./moc-gobernanza/Governance/Governed.sol";

/*
    Supporters contract that we use.
*/
contract SupportersVested is Governed {
    event AddStake(address indexed user, uint256 mocs, uint256 blockNum);
    event Stop(address indexed user, uint256 mocs, uint256 blockNum);
    event ReStake(address indexed user, uint256 mocs, uint256 blockNum);
    event Withdraw(address indexed user, uint256 mocs, uint256 blockNum);


    struct SupportersInfo
    {
        uint256 stakedInBlock;
        uint256 stopInBlock;
        uint256 stopBalanceInMocs;
    }

    mapping(address => SupportersInfo) supportersMap;

    // Supporters contract
    SupportersWhitelisted public supporters;

    IERC20 public mocToken;

    // The minimum number of blocks that a user must stay staked after staking
    uint256 public minStayBlocks;

    // The minimum number of blocks that a user must be stoped to be able to withdraw
    uint256 public minStopBlocks;

    // Total mocs that we store for users == sum(SupportersInfo.stopBalanceInMocs).
    uint256 public totalStopBalanceInMocs;

    function initialize(IGovernor _governor, SupportersWhitelisted _supporters, uint256 _minStayBlocks, uint256 _minStopBlocks) external initializer {
        Governed.initialize(_governor);
        supporters = _supporters;
        mocToken = _supporters.mocToken();
        minStayBlocks = _minStayBlocks;
        minStopBlocks = _minStopBlocks;
    }

    /**
      * @dev Sets the minStayBlocks by gobernanza
      * @param _minStayBlocks- the override minStayBlocks
      */
    function setMinStayBlocks(uint256 _minStayBlocks) external onlyAuthorizedChanger() {
        minStayBlocks = _minStayBlocks;
    }

    /**
      * @dev Sets the minStopBlocks by gobernanza
      * @param _minStopBlocks- the override minStopBlocks
      */
    function setMinStopBlocks(uint256 _minStopBlocks) external onlyAuthorizedChanger() {
        minStopBlocks = _minStopBlocks;
    }


    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
      If some user moves by error some MOC to this contract address we transfer them so they are used as rewards.
    */
    function distribute() external {
        // if somebody does a MOC transfer to our address, use the excess as rewards.
        uint256 mocs = mocToken.balanceOf(address(this));
        if (mocs > totalStopBalanceInMocs) {
            mocToken.transfer(address(supporters), mocs - totalStopBalanceInMocs);
        }
        supporters.distribute();
    }

    /**
      Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool)  {
        return supporters.isReadyToDistribute();
    }


    /**
      add MOCs to stake and receive earnings.

      @param _mocs amount of MOC to stake
    */
    function addStake(uint256 _mocs) external {
        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(msg.sender, address(this), _mocs), "error in transfer from");
        _stakeAtSupporters(_mocs);
        emit AddStake(msg.sender, _mocs, block.number);
    }

    /**
      Stop staking some MOCs
    */
    function stop() external {
        require(supportersMap[msg.sender].stakedInBlock != 0, "Can't stop must add some stake");
        require(supportersMap[msg.sender].stakedInBlock + minStayBlocks < block.number, "Can't stop until minStayBlocks");

        uint256 tokens = supporters.getBalanceAt(address(this), msg.sender);
        uint256 mocs = supporters.withdrawFrom(tokens, msg.sender);

        supportersMap[msg.sender].stopInBlock = block.number;
        supportersMap[msg.sender].stopBalanceInMocs = supportersMap[msg.sender].stopBalanceInMocs + mocs;
        totalStopBalanceInMocs = totalStopBalanceInMocs + mocs;
        emit Stop(msg.sender, mocs, block.number);
    }

    /**
      Restake MOCs
    */
    function reStake() external {
        require(supportersMap[msg.sender].stopInBlock != 0, "Must be stop");
        uint256 mocs = supportersMap[msg.sender].stopBalanceInMocs;
        _stakeAtSupporters(mocs);
        supportersMap[msg.sender].stopInBlock = 0;
        supportersMap[msg.sender].stopBalanceInMocs = 0;
        totalStopBalanceInMocs = totalStopBalanceInMocs - mocs;
        emit ReStake(msg.sender, mocs, block.number);
    }


    /**
      Withdraw MOCs that were already stopped .
    */
    function withdraw() external {
        require(supportersMap[msg.sender].stopInBlock != 0, "Must be stop");
        require(supportersMap[msg.sender].stopInBlock + minStopBlocks < block.number, "Can't withdraw until minStopBlocks");

        uint256 mocs = supportersMap[msg.sender].stopBalanceInMocs;
        require(mocToken.transfer(msg.sender, mocs), "error in transfer");

        supportersMap[msg.sender].stakedInBlock = block.number;
        supportersMap[msg.sender].stopInBlock = 0;
        supportersMap[msg.sender].stopBalanceInMocs = 0;
        totalStopBalanceInMocs = totalStopBalanceInMocs - mocs;
        emit Withdraw(msg.sender, mocs, block.number);
    }

    /**
      Balance of mocs.

      @param _account User address
      @return bal the total staked and stopped mocs for _user
    */
    function balanceOf(address _account) external view returns (uint256 bal) {
        (uint256 staked,, uint256 stopped,) = detailedBalanceOf(_account);
        return staked + stopped;
    }

    /**
      Balance of mocs for _account.

      @param _account User address
      @return staked the total staked mocs for _user
      @return stakedInblock the block in which mocs were staked
      @return stopped the total stopped mocs for _user
      @return stoppedInblock the block in which the mocs where stopped
    */
    function detailedBalanceOf(address _account) public view returns (uint256 staked, uint256 stakedInblock, uint256 stopped, uint256 stoppedInblock) {
        require(_account != address(0), "Address must be != 0");
        return (supporters.getMOCBalanceAt(address(this), _account), supportersMap[_account].stakedInBlock,
        supportersMap[_account].stopBalanceInMocs, supportersMap[_account].stopInBlock);
    }


    function _stakeAtSupporters(uint256 _mocs) private {
        // Stake at Supporters contract
        require(mocToken.approve(address(supporters), _mocs), "error in approve");
        supporters.stakeAt(_mocs, msg.sender);
        supportersMap[msg.sender].stakedInBlock = block.number;
    }
}
