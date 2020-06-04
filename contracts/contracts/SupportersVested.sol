pragma solidity ^0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import "./moc-gobernanza/Governance/Governed.sol";

/*
    Supporters contract that we use.
*/
contract SupportersVested is Governed {
    event AddStake(address indexed user, uint256 mocs, uint256 blockNum);
    event Stop(address indexed user, uint256 blockNum);
    event Withdraw(address indexed user, uint256 mocs, uint256 blockNum);

    mapping(address => uint256) stopInBlockMap;

    // Supporters contract
    SupportersWhitelisted public supporters;

    IERC20 public mocToken;

    // The minimum number of blocks that a user must stay staked after staking
    uint256 public minStayBlocks;

    function initialize(IGovernor _governor, SupportersWhitelisted _supporters, uint256 _minStayBlocks) external initializer {
        Governed.initialize(_governor);
        supporters = _supporters;
        mocToken = _supporters.mocToken();
        minStayBlocks = _minStayBlocks;
    }

    /**
      * @dev Sets the minStayBlocks by gobernanza
      * @param _minStayBlocks- the override minStayBlocks
      */
    function setMinStayBlocks(uint256 _minStayBlocks) external onlyAuthorizedChanger() {
        minStayBlocks = _minStayBlocks;
    }


    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
      If some user moves by error some MOC to this contract address we transfer them so they are used as rewards.
    */
    function distribute() external {
        // if somebody does a MOC transfer to our address, use the excess as rewards.
        uint256 mocs = mocToken.balanceOf(address(this));
        mocToken.transfer(address(supporters), mocs);
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
      add MOCs to stake the approve must be done to this contract.

      @param _mocs amount of MOC to stake
    */
    function addStake(uint256 _mocs) external {
        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(msg.sender, address(this), _mocs), "error in transfer from");
        // Stake at Supporters contract
        require(mocToken.approve(address(supporters), _mocs), "error in approve");
        _stake(_mocs, address(this));
    }

    /**
    add MOCs to stake the approve must be done directly to the SupportersWhitelisted contract.

    @param _mocs amount of MOC to stake
    */
    function stakeDirectly(uint256 _mocs) external {
        _stake(_mocs, msg.sender);
    }

    /**
    add MOCs to stake

    @param _mocs amount of MOC to stake
    @param _source source account from which we must take funds
    */
    function _stake(uint256 _mocs, address _source) internal {
        supporters.stakeAtFrom(_mocs, msg.sender, _source);
        delete stopInBlockMap[msg.sender];
        emit AddStake(msg.sender, _mocs, block.number);
    }

    /**
      Stop staking some MOCs
    */
    function stop() external {
        stopInBlockMap[msg.sender] = block.number;
        emit Stop(msg.sender, block.number);
    }


    /**
      Withdraw MOCs that were already stopped .
    */
    function withdraw() external {
        require(stopInBlockMap[msg.sender] != 0, "Must be stopped");
        require(stopInBlockMap[msg.sender] + minStayBlocks < block.number, "Can't withdraw until minStayBlocks");

        uint256 tokens = supporters.getBalanceAt(address(this), msg.sender);
        uint256 mocs = supporters.withdrawFromTo(tokens, msg.sender, msg.sender);
        delete stopInBlockMap[msg.sender];
        emit Withdraw(msg.sender, mocs, block.number);
    }

    /**
      Balance of mocs.

      @param _account User address
      @return balance the balance of the user
    */
    function balanceOf(address _account) external view returns (uint256 balance) {
        (balance,) = detailedBalanceOf(_account);
        return balance;
    }

    /**
      Balance of mocs for _account.

      @param _account User address
      @return balance the balance of the user
      @return stoppedInblock the block in which the mocs where stopped
    */
    function detailedBalanceOf(address _account) public view returns (uint256 balance, uint256 stoppedInblock) {
        require(_account != address(0), "Address must be != 0");
        return (supporters.getMOCBalanceAt(address(this), _account), stopInBlockMap[_account]);
    }
}
