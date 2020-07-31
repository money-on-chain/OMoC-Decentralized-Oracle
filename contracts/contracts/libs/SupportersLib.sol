pragma solidity 0.6.0;

import {IERC20} from "../openzeppelin/token/ERC20/IERC20.sol";
import {SafeMath} from "../openzeppelin/math/SafeMath.sol";

/*
    Abstract contract meant to be reused.
*/
library SupportersLib {
    /// Global registration information for each oracle
    struct SupportersData {
        // Balance in tokens for each supporter
        mapping(address => mapping(address => uint256)) tokenBalances;

        // Total of tokens created
        uint256 totalSupply;

        // Total of MOC deposited in the contract
        uint256 mocBalance;

        // Initial block where earnings started to be paid
        uint256 startEarnings;
        // Final block where earnings will be paid
        uint256 endEarnings;
        // Amount of earning paid
        uint256 earnings;
        // Number of blocks to distribute earnings
        uint256 period;

        // MOC token address
        IERC20 mocToken;

        // Locked mocs amount for each supporter
        mapping(address => uint256) lockedMocs;
    }

    using SafeMath for uint256;

    event PayEarnings(uint256 earnings, uint256 start, uint256 end);

    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);

    event AddStake(address indexed user, address indexed subaccount,
        address indexed sender, uint256 amount, uint256 mocs);

    event WithdrawStake(address indexed user, address indexed subaccount,
        address indexed destination, uint256 amount, uint256 mocs);


    /**
    Contract creation

    @param _mocToken MOC token address
    @param _period Number of blocks to distribute earnings, round length
    */
    function _initialize(SupportersData storage self, IERC20 _mocToken, uint256 _period) internal {
        self.mocToken = _mocToken;
        self.period = _period;
    }

    /**
      * @dev Sets the period,
      * @param _period- the override minOracleOwnerStake
      */
    function _setPeriod(SupportersData storage self, uint256 _period) internal {
        self.period = _period;
    }

    /**
      * @dev Sets the moc token address,
      * @param _mocToken- the override mocToken
      */
    function _setMocToken(SupportersData storage self, IERC20 _mocToken) internal {
        self.mocToken = _mocToken;
    }

    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
    */
    function _distribute(SupportersData storage self) internal {
        require(_isReadyToDistribute(self), "Not ready to distribute");

        // Calculate deposited earnings that are unaccounted for
        uint256 balance = self.mocToken.balanceOf(address(this));
        self.earnings = balance.sub(self.mocBalance);

        // Start paying earning to the next round
        self.startEarnings = block.number;
        self.endEarnings = self.startEarnings.add(self.period);
        self.mocBalance = balance;

        emit PayEarnings(self.earnings, self.startEarnings, self.endEarnings);
    }

    /**
      Return true if is ready to do a distribute call

      @return true if ready
    */
    function _isReadyToDistribute(SupportersData storage self) internal view returns (bool)  {
        return (self.totalSupply > 0 && block.number > self.endEarnings);
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
      @param _sender sender account that must approve and from which the funds are taken
    */
    function _stakeAtFrom(SupportersData storage self, uint256 _mocs, address _subaccount, address _sender)
    internal {
        uint256 tokens = _mocToToken(self, _mocs);

        self.mocBalance = self.mocBalance.add(_mocs);
        require(self.mocToken.transferFrom(_sender, address(this), _mocs), "error in transfer from");

        __mintToken(self, msg.sender, tokens, _subaccount);

        emit AddStake(msg.sender, _subaccount, _sender, tokens, _mocs);
    }


    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function _withdrawFromTo(SupportersData storage self,
        uint256 _tokens, address _subaccount, address _receiver)
    internal returns (uint256) {
        uint mocs = _tokenToMoc(self, _tokens);

        _burnToken(self, msg.sender, _tokens, _subaccount);

        self.mocBalance = self.mocBalance.sub(mocs);
        require(self.mocToken.transfer(_receiver, mocs), "error in transfer");

        // When last supporter exits move pending earnings to next round
        if (self.totalSupply == 0) {
            _resetEarnings(self);
        }

        emit WithdrawStake(msg.sender, _subaccount, _receiver, _tokens, mocs);
        return mocs;
    }

    /**
      Used by the voting machine to lock an amount of MOCs.

      @param mocHolder the moc holder whose mocs will be locked.
      @param amount amount of mocs to be locked.
      @param endBlock block until which the mocs will be locked.
    */
    function lockMocs(address mocHolder, uint256 amount, uint256 endBlock) external {
        self.lockedMocs[mocHolder] = amount;
    }

    /**
      @notice Gets total amount of locked MOCs.

      @return Total amount of locked MOCs.
    */
    function getTotalLockedMocs() external view returns (uint256) {
        return;
    }

    /**
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function _getBalanceAt(SupportersData storage self, address _user, address _subaccount)
    internal view returns (uint256) {
        return self.tokenBalances[_user][_subaccount];
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function _getMOCBalanceAt(SupportersData storage self, address _user, address _subaccount)
    internal view returns (uint256) {
        return _tokenToMoc(self, self.tokenBalances[_user][_subaccount]);
    }

    /**
      Total tokens created.

      @return total amount of tokens
    */
    function _getTokens(SupportersData storage self) internal view returns (uint256) {
        return self.totalSupply;
    }

    /**
      MOC available for withdrawal.

      @return total amount of MOC
    */
    function _getAvailableMOC(SupportersData storage self) internal view returns (uint256) {
        return self.mocBalance.sub(_getLockedAt(self, block.number));
    }

    /**
      Convert amount MOC to equivalent in token

      @param _mocs Amount of MOC
      @return Equivalent amount of tokens
    */
    function _mocToToken(SupportersData storage self, uint256 _mocs) internal view returns (uint256) {
        uint256 totalMocs = _getAvailableMOC(self);
        uint256 totalTokens = _getTokens(self);
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
    function _tokenToMoc(SupportersData storage self, uint256 _tokens) internal view returns (uint256) {
        uint256 totalTokens = _getTokens(self);
        uint256 totalMocs = _getAvailableMOC(self);
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
    function _getEarningsAt(SupportersData storage self, uint256 _block) internal view returns (uint256) {
        if (self.earnings == 0) return 0;
        if (_block < self.startEarnings) return 0;
        if (_block > self.endEarnings) return self.earnings;
        return self.earnings.mul(_block.sub(self.startEarnings)).div(self.endEarnings.sub(self.startEarnings));
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function _getLockedAt(SupportersData storage self, uint256 _block) internal view returns (uint256) {
        return self.earnings.sub(_getEarningsAt(self, _block));
    }

    /**
      @dev Create tokens and assign to a user

      @param _user User address to be assigned tokens
      @param _amount Amount of tokens to create
      @param _subaccount Subaccount to store tokens
    */
    function __mintToken(SupportersData storage self, address _user, uint256 _amount, address _subaccount) internal {
        self.tokenBalances[_user][_subaccount] = self.tokenBalances[_user][_subaccount].add(_amount);
        self.totalSupply = self.totalSupply.add(_amount);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function _getEarningsInfo(SupportersData storage self) internal view returns (uint256, uint256, uint256) {
        uint256 next = self.mocToken.balanceOf(address(this)).sub(self.mocBalance);
        uint256 distributed = _getEarningsAt(self, block.number);
        return (self.earnings, distributed, next);
    }

    /**
      @dev Destroy tokens from a user

      @param _user User address containing tokens
      @param _amount Amount of tokens to destroy
      @param _subaccount Subaccount with tokens
    */
    function _burnToken(SupportersData storage self, address _user, uint256 _amount, address _subaccount) internal {
        self.tokenBalances[_user][_subaccount] = self.tokenBalances[_user][_subaccount].sub(_amount);
        self.totalSupply = self.totalSupply.sub(_amount);
    }

    /**
      @dev Reset earnings

      Move pending earnings on the current round to the next one
    */
    function _resetEarnings(SupportersData storage self) internal {
        uint256 pending = self.mocBalance;
        self.mocBalance = 0;
        self.earnings = 0;
        emit CancelEarnings(pending, self.startEarnings, self.endEarnings);
    }
}
