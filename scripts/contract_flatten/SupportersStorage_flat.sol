/*
Copyright MOC Investments Corp. 2020. All rights reserved.

You acknowledge and agree that MOC Investments Corp. (“MOC”) (or MOC’s licensors) own all legal right, title and
interest in and to the work, software, application, source code, documentation and any other documents in this
repository (collectively, the “Program”), including any intellectual property rights which subsist in the
Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist),
whether in source code or any other form.

Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy,
modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise
attempt to extract the source code of, the Program or any part thereof, except that you may contribute to
this repository.

You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify,
merge, combine with another program or create derivative works of the Program (such resulting program, collectively,
the “Resulting Program”) solely for Non-Commercial Use as long as you:

 1. give prominent notice (“Notice”) with each copy of the Resulting Program that the Program is used in the Resulting
  Program and that the Program is the copyright of MOC Investments Corp.; and
 2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith,
  combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial
  Use restriction set forth herein.

“Non-Commercial Use” means each use as described in clauses (1)-(3) below, as reasonably determined by MOC Investments
Corp. in its sole discretion:

 1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each
 case without any anticipated commercial application;
 2. use by any charitable organization, educational institution, public research organization, public safety or health
 organization, environmental protection organization or government institution; or
 3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally
 do not exceed 100 at any time.

You will not use any trade mark, service mark, trade name, logo of MOC Investments Corp. or any other company or
organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks,
names or logos.

If you have any questions, comments or interest in pursuing any other use cases, please reach out to us
at moc.license@moneyonchain.com.

*/

pragma solidity 0.6.12;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     */
    bool private initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private initializing;

    /**
     * @dev Modifier to use in the initializer function of a contract.
     */
    modifier initializer() {
        require(
            initializing || isConstructor() || !initialized,
            "Contract instance has already been initialized"
        );

        bool isTopLevelCall = !initializing;
        if (isTopLevelCall) {
            initializing = true;
            initialized = true;
        }

        _;

        if (isTopLevelCall) {
            initializing = false;
        }
    }

    /// @dev Returns true if and only if the function is running in the constructor
    function isConstructor() private view returns (bool) {
        // extcodesize checks the size of the code stored in an address, and
        // address returns the current address. Since the code is still not
        // deployed when running a constructor, any checks on its code size will
        // yield zero, making it an effective way to detect if a contract is
        // under construction or not.
        address self = address(this);
        uint256 cs;
        assembly {
            cs := extcodesize(self)
        }
        return cs == 0;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}

/**
  @title ChangeContract
  @notice This interface is the one used by the governance system.
  @dev If you plan to do some changes to a system governed by this project you should write a contract
  that does those changes, like a recipe. This contract MUST not have ANY kind of public or external function
  that modifies the state of this ChangeContract, otherwise you could run into front-running issues when the governance
  system is fully in place.
 */
interface ChangeContract {
    /**
      @notice Override this function with a recipe of the changes to be done when this ChangeContract
      is executed
     */
    function execute() external;
}

/**
  @title Governor
  @notice Governor interface. This functions should be overwritten to
  enable the comunnication with the rest of the system
  */
interface IGovernor {
    /**
      @notice Function to be called to make the changes in changeContract
      @dev This function should be protected somehow to only execute changes that
      benefit the system. This decision process is independent of this architechture
      therefore is independent of this interface too
      @param changeContract Address of the contract that will execute the changes
     */
    function executeChange(ChangeContract changeContract) external;

    /**
      @notice Function to be called to make the changes in changeContract
      @param _changer Address of the contract that will execute the changes
     */
    function isAuthorizedChanger(address _changer) external view returns (bool);
}

/**
  @title Governed
  @notice Base contract to be inherited by governed contracts
  @dev This contract is not usable on its own since it does not have any _productive useful_ behaviour
  The only purpose of this contract is to define some useful modifiers and functions to be used on the
  governance aspect of the child contract
  */
contract Governed {
    /**
      @notice The address of the contract which governs this one
     */
    IGovernor public governor;

    string private constant NOT_AUTHORIZED_CHANGER = "not_authorized_changer";

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be called through
      the governance system
     */
    modifier onlyAuthorizedChanger() {
        require(governor.isAuthorizedChanger(msg.sender), NOT_AUTHORIZED_CHANGER);
        _;
    }

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function _initialize(IGovernor _governor) internal {
        governor = _governor;
    }

    /**
      @notice Change the contract's governor. Should be called through the old governance system
      @param newIGovernor New governor address
     */
    function changeIGovernor(IGovernor newIGovernor) external onlyAuthorizedChanger {
        governor = newIGovernor;
    }

    /**
      @notice This method is used by a change contract to access the storage freely even without a setter.
      @param data the serialized function arguments
     */
    function delegateCallToChanger(
        bytes calldata data
    ) external onlyAuthorizedChanger returns (bytes memory) {
        address changerContrat = msg.sender;
        (bool success, bytes memory result) = changerContrat.delegatecall(
            abi.encodeWithSignature("impersonate(bytes)", data)
        );
        require(success, "Error in delegate call");
        return result;
    }

    // Leave a gap betweeen inherited contracts variables in order to be
    // able to add more variables in them later
    uint256[50] private upgradeGap;
}

/**
  @notice Based on heavily on EnumberableSet, but with the ability to clear all the contents.
 */
library AddressSetLib {
    using SafeMath for uint256;

    struct AddressSet {
        // Storage of set values
        address[] _values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping(address => uint256) _indexes;
    }

    function init() internal pure returns (AddressSet memory) {
        return AddressSet({_values: new address[](0)});
    }

    /**
     * @dev Removes all value from a set. O(N).
     *
     */
    function clear(AddressSet storage set) internal {
        for (uint256 i = 0; i < set._values.length; i++) {
            delete set._indexes[set._values[i]];
        }
        delete set._values;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(AddressSet storage set, address value) internal returns (bool) {
        if (!contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._indexes[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(AddressSet storage set, address value) internal returns (bool) {
        // We read and store the value's index to prevent multiple reads from the same storage slot
        uint256 valueIndex = set._indexes[value];

        if (valueIndex != 0) {
            // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = set._values.length - 1;

            // When the value to delete is the last one, the swap operation is unnecessary. However, since this occurs
            // so rarely, we still do the swap anyway to avoid the gas cost of adding an 'if' statement.

            address lastvalue = set._values[lastIndex];

            // Move the last value to the index where the value to delete is
            set._values[toDeleteIndex] = lastvalue;
            // Update the index for the moved value
            set._indexes[lastvalue] = toDeleteIndex + 1;
            // All indexes are 1-based

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the index for the deleted slot
            delete set._indexes[value];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value) internal view returns (bool) {
        return set._indexes[value] != 0;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(AddressSet storage set) internal view returns (uint256) {
        return set._values.length;
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(AddressSet storage set, uint256 index) internal view returns (address) {
        require(set._values.length > index, "index out of bounds");
        return set._values[index];
    }

    /**
     * @dev Returns the set contents as an array
     */
    function asArray(
        AddressSet storage set
    ) internal view returns (address[] memory selectedOracles) {
        return set._values;
    }
}

/**
  @dev An iterable mapping of addresses to boolean, used to check if an address is whitelisted.
 */
contract IIterableWhitelist {
    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier whitelistedOrExternal(IterableWhitelistLib.IterableWhitelistData storage self) {
        // We use address(1) to allow calls from outside the block chain to peek
        // The call must use msg.sender == 1 (or { from: 1 }) something that only can be done from
        // outside the blockchain.
        require(
            msg.sender == address(1) || IterableWhitelistLib._isWhitelisted(self, msg.sender),
            "Address is not whitelisted"
        );
        _;
    }

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier onlyWhitelisted(IterableWhitelistLib.IterableWhitelistData storage self) {
        require(
            IterableWhitelistLib._isWhitelisted(self, msg.sender),
            "Address is not whitelisted"
        );
        _;
    }
}

library IterableWhitelistLib {
    using AddressSetLib for AddressSetLib.AddressSet;

    struct IterableWhitelistData {
        AddressSetLib.AddressSet _inner;
    }

    /**
     * @dev Check if an account is whitelisted
     * @return Bool
     */
    function _isWhitelisted(
        IterableWhitelistData storage self,
        address account
    ) internal view returns (bool) {
        require(account != address(0), "Account must not be 0x0");
        return self._inner.contains(account);
    }

    /**
     * @dev Add account to whitelist
     */
    function _addToWhitelist(IterableWhitelistData storage self, address account) internal {
        require(account != address(0), "Account must not be 0x0");
        bool added = self._inner.add(account);
        require(added, "Account already whitelisted");
    }

    /**
     * @dev Remove account to whitelist
     */
    function _removeFromWhitelist(IterableWhitelistData storage self, address account) internal {
        require(account != address(0), "Account must not be 0x0");
        bool removed = self._inner.remove(account);
        require(removed, "Missing account");
    }

    /// @notice Returns the count of whitelisted addresses.
    function _getWhiteListLen(IterableWhitelistData storage self) internal view returns (uint256) {
        return self._inner.length();
    }

    /// @notice Returns the address at index.
    /// @param idx index to query.
    function _getWhiteListAtIndex(
        IterableWhitelistData storage self,
        uint256 idx
    ) internal view returns (address) {
        return self._inner.at(idx);
    }
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

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
    }

    using SafeMath for uint256;

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
    function _isReadyToDistribute(SupportersData storage self) internal view returns (bool) {
        return (self.totalSupply > 0 && block.number > self.endEarnings);
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
      @param _sender sender account that must approve and from which the funds are taken
    */
    function _stakeAtFrom(
        SupportersData storage self,
        uint256 _mocs,
        address _subaccount,
        address _sender
    ) internal {
        uint256 tokens = _mocToToken(self, _mocs);
        _stakeAtFromInternal(self, tokens, _mocs, _subaccount, _sender);
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _tokens amount of tokens to stake
      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
      @param _sender sender account that must approve and from which the funds are taken
    */
    function _stakeAtFromInternal(
        SupportersData storage self,
        uint256 _tokens,
        uint256 _mocs,
        address _subaccount,
        address _sender
    ) internal {
        // Done outside this contract so we can get the value of
        // uint256 tokens = _mocToToken(self, _mocs);
        self.mocBalance = self.mocBalance.add(_mocs);
        require(
            self.mocToken.transferFrom(_sender, address(this), _mocs),
            "error in transfer from"
        );

        __mintToken(self, msg.sender, _tokens, _subaccount);

        emit AddStake(msg.sender, _subaccount, _sender, _tokens, _mocs);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function _withdrawFromTo(
        SupportersData storage self,
        uint256 _tokens,
        address _subaccount,
        address _receiver
    ) internal returns (uint256) {
        uint256 mocs = _tokenToMoc(self, _tokens);

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
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function _getBalanceAt(
        SupportersData storage self,
        address _user,
        address _subaccount
    ) internal view returns (uint256) {
        return self.tokenBalances[_user][_subaccount];
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function _getMOCBalanceAt(
        SupportersData storage self,
        address _user,
        address _subaccount
    ) internal view returns (uint256) {
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
    function _mocToToken(
        SupportersData storage self,
        uint256 _mocs
    ) internal view returns (uint256) {
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
    function _tokenToMoc(
        SupportersData storage self,
        uint256 _tokens
    ) internal view returns (uint256) {
        uint256 totalTokens = _getTokens(self);
        uint256 totalMocs = _getAvailableMOC(self);
        if (totalMocs == 0) {
            return 0;
        }
        return _tokens.mul(totalMocs).div(totalTokens);
    }

    /**
      Convert tokens to equivalente in MOC ceiling up

      @param _tokens Amount of tokens
      @return Equivalent amount of MOC
    */
    function _tokenToMocUP(
        SupportersData storage self,
        uint256 _tokens
    ) internal view returns (uint256) {
        uint256 totalTokens = _getTokens(self);
        uint256 totalMocs = _getAvailableMOC(self);
        if (totalMocs == 0) {
            return 0;
        }
        return _tokens.mul(totalMocs).add(totalTokens).sub(1).div(totalTokens);
    }

    /**
      Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function _getEarningsAt(
        SupportersData storage self,
        uint256 _block
    ) internal view returns (uint256) {
        if (self.earnings == 0) return 0;
        if (_block < self.startEarnings) return 0;
        if (_block > self.endEarnings) return self.earnings;
        return
            self.earnings.mul(_block.sub(self.startEarnings)).div(
                self.endEarnings.sub(self.startEarnings)
            );
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function _getLockedAt(
        SupportersData storage self,
        uint256 _block
    ) internal view returns (uint256) {
        return self.earnings.sub(_getEarningsAt(self, _block));
    }

    /**
      @dev Create tokens and assign to a user

      @param _user User address to be assigned tokens
      @param _amount Amount of tokens to create
      @param _subaccount Subaccount to store tokens
    */
    function __mintToken(
        SupportersData storage self,
        address _user,
        uint256 _amount,
        address _subaccount
    ) internal {
        self.tokenBalances[_user][_subaccount] = self.tokenBalances[_user][_subaccount].add(
            _amount
        );
        self.totalSupply = self.totalSupply.add(_amount);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function _getEarningsInfo(
        SupportersData storage self
    ) internal view returns (uint256, uint256, uint256) {
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
    function _burnToken(
        SupportersData storage self,
        address _user,
        uint256 _amount,
        address _subaccount
    ) internal {
        self.tokenBalances[_user][_subaccount] = self.tokenBalances[_user][_subaccount].sub(
            _amount
        );
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

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using SupportersLib for SupportersLib.SupportersData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    struct LockingInfo {
        uint256 untilTimestamp;
        uint256 amount;
    }

    mapping(address => LockingInfo) public lockedMocs;

    // Whitelisted contracts that can add/remove stake in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    SupportersLib.SupportersData internal supportersData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
