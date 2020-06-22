pragma solidity 0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SafeMath} from "./openzeppelin/math/SafeMath.sol";

/*
    Abstract contract meant to be reused.
*/
contract SupportersAbstract {
    using SafeMath for uint256;

    event PayEarnings(uint256 earnings, uint256 start, uint256 end);

    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);

    event AddStake(address indexed user, address indexed subaccount, address indexed sender, uint256 amount, uint256 mocs);

    event WithdrawStake(address indexed user, address indexed subaccount, address indexed destination, uint256 amount, uint256 mocs);

    // Balance in tokens for each supporter
    mapping(address => mapping(address => uint256)) internal tokenBalances;

    // Total of tokens created
    uint256 public totalSupply;

    // Total of MOC deposited in the contract
    uint256 public mocBalance;

    // Initial block where earnings started to be paid
    uint256 public startEarnings;
    // Final block where earnings will be paid
    uint256 public endEarnings;
    // Amount of earning paid
    uint256 public earnings;
    // Number of blocks to distribute earnings
    uint256 public period;

    // MOC token address
    IERC20 public mocToken;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    /**
    Contract creation

    @param _mocToken MOC token address
    @param _period Number of blocks to distribute earnings, round length
    */
    function _initialize(IERC20 _mocToken, uint256 _period) internal {
        mocToken = _mocToken;
        period = _period;
    }

    /**
      * @dev Sets the period,
      * @param _period- the override minOracleOwnerStake
      */
    function _setPeriod(uint256 _period) internal {
        period = _period;
    }

    /**
      * @dev Sets the moc token address,
      * @param _mocToken- the override mocToken
      */
    function _setMocToken(IERC20 _mocToken) internal {
        mocToken = _mocToken;
    }

    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
    */
    function _distribute() internal {
        require(_isReadyToDistribute(), "Not ready to distribute");

        // Calculate deposited earnings that are unaccounted for
        uint256 balance = mocToken.balanceOf(address(this));
        earnings = balance.sub(mocBalance);

        // Start paying earning to the next round
        startEarnings = block.number;
        endEarnings = startEarnings.add(period);
        mocBalance = balance;

        emit PayEarnings(earnings, startEarnings, endEarnings);
    }

    /**
      Return true if is ready to do a distribute call

      @return true if ready
    */
    function _isReadyToDistribute() internal view returns (bool)  {
        return (totalSupply > 0 && block.number > endEarnings);
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
      @param _sender sender account that must approve and from which the funds are taken
    */
    function _stakeAtFrom(uint256 _mocs, address _subaccount, address _sender) virtual internal {
        uint256 tokens = _mocToToken(_mocs);

        mocBalance = mocBalance.add(_mocs);
        require(mocToken.transferFrom(_sender, address(this), _mocs), "error in transfer from");

        __mintToken(msg.sender, tokens, _subaccount);

        emit AddStake(msg.sender, _subaccount, _sender, tokens, _mocs);
    }


    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function _withdrawFromTo(uint256 _tokens, address _subaccount, address _receiver) virtual internal returns (uint256) {
        uint mocs = _tokenToMoc(_tokens);

        _burnToken(msg.sender, _tokens, _subaccount);

        mocBalance = mocBalance.sub(mocs);
        require(mocToken.transfer(_receiver, mocs), "error in transfer");

        // When last supporter exits move pending earnings to next round
        if (totalSupply == 0) {
            _resetEarnings();
        }

        emit WithdrawStake(msg.sender, _subaccount, _receiver, _tokens, mocs);
        return mocs;
    }

    /**
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function _getBalanceAt(address _user, address _subaccount) internal view returns (uint256) {
        return tokenBalances[_user][_subaccount];
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function _getMOCBalanceAt(address _user, address _subaccount) internal view returns (uint256) {
        return _tokenToMoc(tokenBalances[_user][_subaccount]);
    }

    /**
      Total tokens created.

      @return total amount of tokens
    */
    function _getTokens() internal view returns (uint256) {
        return totalSupply;
    }

    /**
      MOC available for withdrawal.

      @return total amount of MOC
    */
    function _getAvailableMOC() internal view returns (uint256) {
        return mocBalance.sub(_getLockedAt(block.number));
    }

    /**
      Convert amount MOC to equivalent in token

      @param _mocs Amount of MOC
      @return Equivalent amount of tokens
    */
    function _mocToToken(uint256 _mocs) internal view returns (uint256) {
        uint256 totalMocs = _getAvailableMOC();
        uint256 totalTokens = _getTokens();
        if (totalMocs == 0 && totalTokens == 0) {
            return _mocs;
        }
        return _mocs.mul(totalTokens).div(totalMocs);
    }

    /**
      Convert tokens to equivalente in MOC

      @param _tokens Amount of tokens
      @return Equivalent amount of MOC
    */
    function _tokenToMoc(uint256 _tokens) internal view returns (uint256) {
        uint256 totalTokens = _getTokens();
        uint256 totalMocs = _getAvailableMOC();
        if (totalMocs == 0) {
            return 0;
        }
        return _tokens.mul(totalMocs).div(totalTokens);
    }

    /**
      Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function _getEarningsAt(uint256 _block) internal view returns (uint256) {
        if (earnings == 0) return 0;
        if (_block < startEarnings) return 0;
        if (_block > endEarnings) return earnings;
        return earnings.mul(_block.sub(startEarnings)).div(endEarnings.sub(startEarnings));
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function _getLockedAt(uint256 _block) internal view returns (uint256) {
        return earnings.sub(_getEarningsAt(_block));
    }

    /**
      @dev Create tokens and assign to a user

      @param _user User address to be assigned tokens
      @param _amount Amount of tokens to create
      @param _subaccount Subaccount to store tokens
    */
    function __mintToken(address _user, uint256 _amount, address _subaccount) internal {
        tokenBalances[_user][_subaccount] = tokenBalances[_user][_subaccount].add(_amount);
        totalSupply = totalSupply.add(_amount);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function _getEarningsInfo() internal view returns (uint256, uint256, uint256) {
        uint256 next = mocToken.balanceOf(address(this)).sub(mocBalance);
        uint256 distributed = _getEarningsAt(block.number);
        return (earnings, distributed, next);
    }

    /**
      @dev Destroy tokens from a user

      @param _user User address containing tokens
      @param _amount Amount of tokens to destroy
      @param _subaccount Subaccount with tokens
    */
    function _burnToken(address _user, uint256 _amount, address _subaccount) internal {
        tokenBalances[_user][_subaccount] = tokenBalances[_user][_subaccount].sub(_amount);
        totalSupply = totalSupply.sub(_amount);
    }

    /**
      @dev Reset earnings

      Move pending earnings on the current round to the next one
    */
    function _resetEarnings() internal {
        uint256 pending = mocBalance;
        mocBalance = 0;
        earnings = 0;
        emit CancelEarnings(pending, startEarnings, endEarnings);
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
