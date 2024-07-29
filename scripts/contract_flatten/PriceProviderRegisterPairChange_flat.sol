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

interface IRegistry {
    // *** Getter Methods ***
    function getDecimal(bytes32 _key) external view returns (int232 base, int16 exp);

    function getUint(bytes32 _key) external view returns (uint248);

    function getString(bytes32 _key) external view returns (string memory);

    function getAddress(bytes32 _key) external view returns (address);

    function getBytes(bytes32 _key) external view returns (bytes memory);

    function getBool(bytes32 _key) external view returns (bool);

    function getInt(bytes32 _key) external view returns (int248);

    // *** Setter Methods ***
    function setDecimal(bytes32 _key, int232 _base, int16 _exp) external;

    function setUint(bytes32 _key, uint248 _value) external;

    function setString(bytes32 _key, string calldata _value) external;

    function setAddress(bytes32 _key, address _value) external;

    function setBytes(bytes32 _key, bytes calldata _value) external;

    function setBool(bytes32 _key, bool _value) external;

    function setInt(bytes32 _key, int248 _value) external;

    // *** Delete Methods ***
    function deleteDecimal(bytes32 _key) external;

    function deleteUint(bytes32 _key) external;

    function deleteString(bytes32 _key) external;

    function deleteAddress(bytes32 _key) external;

    function deleteBytes(bytes32 _key) external;

    function deleteBool(bytes32 _key) external;

    function deleteInt(bytes32 _key) external;

    // Nov 2020 Upgrade
    // *** Getter Methods ***
    function getAddressArrayLength(bytes32 _key) external view returns (uint256);

    function getAddressArrayElementAt(bytes32 _key, uint256 idx) external view returns (address);

    function pushAddressArrayElement(bytes32 _key, address _addr) external;

    function getAddressArray(bytes32 _key) external view returns (address[] memory);

    function addressArrayContains(bytes32 _key, address value) external view returns (bool);

    // *** Setters ***
    function pushAddressArray(bytes32 _key, address[] memory data) external;

    function clearAddressArray(bytes32 _key) external;

    function removeAddressArrayElement(bytes32 _key, address value) external;
}

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
/// This contract has two lists:
/// 1) A subscribed list (EnumerableSet.AddressSet) oracles owner addresses, this list has a max size (30).
/// 2) A selected list, EnumerableSet.AddressSet of oracles owner addresses that are selected to participate in
/// current publication round (10 entries max size).
///
/// Oracles are subscribed by adding them to the subscribed oracle list. When the list is full
/// the oracle with less stake can be removed by a new oracle that is trying to
/// subscribe (if its stake is greater than his).
/// On each round switch the list of selected oracles is populated with the 10 Oracles with more stake. An oracle
/// can unsubscribe itself from the subscribed list in the middle of the round, in this case, the oracle is still
/// listed in the selected list until the round ends.
/// If an oracle withdraw some stake then his participation in the round is put into consideration: If the
/// oracle ends up having less stake than the next oracle in the subscribed list (but not in the selected list) then
/// it is removed from the selected list and the point he accumulated during the round are lost (set to zero).

interface ICoinPairPrice {
    // generated by ..::_distributeRewards()
    event OracleRewardTransfer(
        uint256 roundNumber,
        address oracleOwnerAddress,
        address toOwnerAddress,
        uint256 amount
    );
    // generated by ..::publishPrice()
    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    // generated by ..::emergencyPublish()
    event EmergencyPricePublished(
        address sender,
        uint256 price,
        address votedOracle,
        uint256 blockNumber
    );
    // generated by ..::switchRound()
    event NewRound(
        address caller,
        uint256 number,
        uint256 totalPoints,
        uint256 startBlock,
        uint256 lockPeriodTimestamp,
        address[] selectedOracles
    );

    // getOracleOwnerAddress: Given an Oracle address return the Oracle Owner address.
    // Used during publication, the servers sign with the oracle address, but the list of selected oracles
    // is by oracle owner address.
    // getOracleOwnerStake: Get the stake stored in the supporters smart-contract
    // prettier-ignore
    struct CoinPairPriceCallbacks {
        function (address) external view returns (address) getOracleOwnerAddress;
        function (address) external view returns (uint256) getOracleOwnerStake;
    }

    /// @notice subscribe an oracle to this coin pair, allowing it to be selected in the next round.
    /// If the subscribed list is full and the current oracle has more stake than one with minimum stake in the
    /// subscribed list, then the one with minimum stake is replaced.
    /// @param oracleOwnerAddr The address of the owner of the oracle to remove from system.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleOwnerAddr) external;

    /// @notice Unsubscribe an oracle from this coin pair. The oracle won't be selected in the next round.
    /// After the round end, the oracle can withdraw stake without having the risk of loosing won points.
    /// @param oracleOwnerAddr The address of the owner of the oracle to remove from system.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleOwnerAddr) external;

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleOwnerAddr The address of the owner of the oracle to remove from system.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleOwnerAddr) external view returns (bool);

    /// @notice Publish a price. (The message contain oracleAddresses that must be converted to owner addresses).
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The block number acting as nonce to prevent replay attacks.
    /// @param _sigV The array of V-component of Oracle signatures.
    /// @param _sigR The array of R-component of Oracle signatures.
    /// @param _sigS The array of S-component of Oracle signatures.
    function publishPrice(
        uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external;

    /// @notice Publish a price without signature validation (when there is an emergecy!!!).
    /// @param _price Price to report.
    function emergencyPublish(uint256 _price) external;

    /// @notice The oracle owner has withdrawn some stake.
    /// Must check if the oracle is part of current round and if he lost his place with the
    /// new stake value (the stake is global and is saved in the supporters contract).
    /// @param oracleOwnerAddr the oracle owner that is trying to withdraw
    function onWithdraw(address oracleOwnerAddr) external returns (uint256);

    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    /// This method search the subscribed list and choose the 10 with more stake.
    function switchRound() external;

    //////////////////////////////////////////////////////////////////////////////////// GETTERS

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() external view returns (uint256);

    //////////////////////////////////////////////////////////////////////////////////// GETTERS TO GET CURRENT PRICE
    // MUST BE WHITELISTED
    /// @notice Return the current price, compatible with old MOC Oracle
    function peek() external view returns (bytes32, bool);

    /// @notice Return the current price
    function getPrice() external view returns (uint256);

    ///////////////////////////////////////////////////////////////////////////////// GETTERS TO GET CURRENT PRICE END

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOwners,
            address[] memory selectedOracles
        );

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(
        address addr
    ) external view returns (uint256 points, bool selectedInCurrentRound);

    // The maximum count of oracles selected to participate each round
    function maxOraclesPerRound() external view returns (uint256);

    // The round lock period in secs
    function roundLockPeriodSecs() external view returns (uint256);

    function isOracleInCurrentRound(address oracleAddr) external view returns (bool);

    /// @notice Returns the amount of oracles subscribed to this coin pair.
    function getSubscribedOraclesLen() external view returns (uint256);

    /// @notice Returns the oracle owner address that is subscribed to this coin pair
    /// @param idx index to query.
    function getSubscribedOracleAtIndex(uint256 idx) external view returns (address ownerAddr);

    // Public variable
    function getMaxSubscribedOraclesPerRound() external view returns (uint256);

    // Public variable
    function getCoinPair() external view returns (bytes32);

    // Public variable
    function getLastPublicationBlock() external view returns (uint256);

    // Public variable
    function getValidPricePeriodInBlocks() external view returns (uint256);

    // Public variable
    function getEmergencyPublishingPeriodInBlocks() external view returns (uint256);

    // Public variable
    function getOracleManager() external view returns (IOracleManager);

    // Public variable
    function getToken() external view returns (IERC20);

    function getRegistry() external view returns (IRegistry);

    // Public value from Registry:
    //   The minimum count of oracles selected to participate each round
    function getMinOraclesPerRound() external view returns (uint256);
}

interface IDelayMachine {
    // generated by ..::deposit()
    event PaymentDeposit(
        uint256 indexed id,
        address source,
        address destination,
        uint256 amount,
        uint256 expiration
    );
    // generated by ..::cancel()
    event PaymentCancel(uint256 indexed id, address source, address destination, uint256 amount);
    // generated by ..::withdraw()
    event PaymentWithdraw(uint256 indexed id, address source, address destination, uint256 amount);

    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @param expiration the expiration date for this deposit
    /// @return id the transaction id
    function deposit(
        uint256 mocs,
        address destination,
        uint256 expiration
    ) external returns (uint256 id);

    /// @notice Cancel a transaction returning the funds to the source
    /// @param id transaction id
    function cancel(uint256 id) external;

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param id transaction id
    function withdraw(uint256 id) external;

    /// @notice Returns the list of transaction for some account
    /// @return ids transaction ids
    /// @return amounts token quantity
    /// @return expirations expiration dates
    function getTransactions(
        address account
    )
        external
        view
        returns (uint256[] memory ids, uint256[] memory amounts, uint256[] memory expirations);

    /// @notice Returns the total balance in MOCs for an account
    function getBalance(address account) external view returns (uint256);

    // Public variable
    function getToken() external view returns (IERC20);

    // Public variable
    function getLastId() external view returns (uint256);

    // Public variable
    function getSource() external view returns (address);
}

interface IStakingMachine {
    /// @notice Used by the voting machine to lock the current balance of MOCs.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 untilTimestamp) external;

    /// @notice Accept a deposit from an account.
    /// Delegate to the Supporters smart contract.
    /// @param mocs token quantity
    function deposit(uint256 mocs) external;

    /// @notice Accept a deposit from an account.
    /// Delegate to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination must be always msg.sender.
    function deposit(uint256 mocs, address destination) external;

    /// @notice Accept a deposit from an account, can be only called by the delayMachine    .
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    /// @param source the address that approved the transfer
    function depositFrom(uint256 mocs, address destination, address source) external;

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param mocs token quantity
    function withdraw(uint256 mocs) external;

    /// @notice Withdraw all the stake and send it to the delay machine.
    function withdrawAll() external;

    /// @notice Reports the balance of MOCs for a specific user.
    /// @param user user address
    function getBalance(address user) external view returns (uint256);

    /// @notice Reports the balance of tokens for a specific user.
    /// @param user user address
    function getTokenBalance(address user) external view returns (uint256);

    /// @notice Reports the locked balance of MOCs for a specific user.
    /// @param user user address
    function getLockedBalance(address user) external view returns (uint256);

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    /// @return amount the amount of mocs locked
    /// @return untilTimestamp the timestamp that corresponds to the locking date.
    function getLockingInfo(
        address user
    ) external view returns (uint256 amount, uint256 untilTimestamp);

    // Public variable
    function getSupporters() external view returns (address);

    // Public variable
    function getOracleManager() external view returns (IOracleManager);

    // Public variable
    function getMocToken() external view returns (IERC20);

    // Public variable
    function getDelayMachine() external view returns (IDelayMachine);

    // Public variable
    function getWithdrawLockTime() external view returns (uint256);
}

interface IStakingMachineOracles {
    /// @notice Register an oracle
    /// @param oracleAddr address of the oracle (from which we publish prices)
    /// @param url url used by the oracle server
    function registerOracle(address oracleAddr, string calldata url) external;

    /// @notice Change the oracle "internet" name (URI)
    /// @param url The new url to set.
    function setOracleName(string calldata url) external;

    /// @notice Change the oracle address
    /// @param oracleAddr The new oracle address
    function setOracleAddress(address oracleAddr) external;

    /// @notice Return true if the oracle is registered.
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool);

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool);

    /// @notice Remove an oracle.
    function removeOracle() external;

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256);

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32);

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address);

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256);

    /// @notice Subscribe an oracle to a coin pair.
    /// @param coinPair coin pair to subscribe, for example BTCUSD
    function subscribeToCoinPair(bytes32 coinPair) external;

    /// @notice Unsubscribe an oracle from a coin pair.
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function unSubscribeFromCoinPair(bytes32 coinPair) external;

    /// @notice Returns true if an oracle is subscribed to a coin pair
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function isSubscribed(address oracleAddr, bytes32 coinPair) external view returns (bool);

    /// @notice Returns the amount of owners registered.
    /// Delegates to the Oracle Manager smart contract.
    function getRegisteredOraclesLen() external view returns (uint256);

    /// @notice Returns the oracle name and address at index.
    /// Delegates to the Oracle Manager smart contract.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(
        uint256 idx
    ) external view returns (address ownerAddr, address oracleAddr, string memory url);
}

/// This contract manages the Oracle and CoinPair registration info.
/// The Oracle python server interacts with this contract:
/// - Coin pair registration
/// - Oracle registration to coin pairs
/// - Access Oracle info (oracle address + url) indexed by oracle owner address
/// - Get the oracle information (url + the specifics of some coin pair rounds) from an oracle address
/// - Get the oracle address from the owner address.
interface IOracleManager {
    //  generated by ..::registerOracle()
    event OracleRegistered(address caller, address addr, string internetName);
    // //  -not called
    // event OracleStakeAdded(address caller, address addr, uint256 stake);
    //  generated by ..::subscribeToCoinPair()
    event OracleSubscribed(address caller, bytes32 coinpair);
    //  generated by ..::unSubscribeFromCoinPair()
    event OracleUnsubscribed(address caller, bytes32 coinpair);
    //  generated by ..::removeOracle()
    event OracleRemoved(address caller);

    // getOracleOwnerStake: Get the stake stored in the supporters smart-contract
    // prettier-ignore
    struct OracleManagerCallbacks {
        function (address) external view returns (uint256) getOracleOwnerStake;
    }

    /// @notice Register a new coin pair contract (the contract must be created separately).
    /// Once created the coin pairs cannot be removed.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coin pair.
    function registerCoinPair(bytes32 coinPair, address addr) external;

    /// Register an oracle in the system must be called by the oracle owner.
    /// @notice Registers the oracle and transfer the specified caller's MOC token stake.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(
        address oracleOwnerAddr,
        address oracleAddr,
        string calldata internetName
    ) external;

    /// @notice Change the oracle "internet" name (URI), called by the owner.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param name The new name to set.
    function setOracleName(address oracleOwnerAddr, string calldata name) external;

    /// @notice Change the oracle address, called by the owner.
    /// @param oracleOwnerAddr The address of the owner of the oracle.
    /// @param oracleAddr new value for the address of the oracle
    function setOracleAddress(address oracleOwnerAddr, address oracleAddr) external;

    /// @notice Removes the oracle registration info. Must be called by the owner
    /// The oracle must be previously unregistered from all coin pairs.
    /// @param oracleOwnerAddr The address of the owner of the oracle to remove from system.
    function removeOracle(address oracleOwnerAddr) external;

    /// @notice Subscribe a registered oracle to participate in the next round of a registered coin-pair.
    /// @param oracleOwnerAddr Address of oracle owner
    function subscribeToCoinPair(address oracleOwnerAddr, bytes32 coinPair) external;

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair.
    /// The oracle is flagged so it is not selected in the next round.
    /// @param oracleOwnerAddr Address of oracle owner
    function unSubscribeFromCoinPair(address oracleOwnerAddr, bytes32 coinPair) external;

    /// @notice The oracle owner did a partial withdrawal of funds
    /// 1. The oracle address is searched by the owner address.
    /// 2. Each coin pair to which the oracle is subscribed is consulted to:
    ///   - Check if the new amount is enough to stay in the current round.
    ///       If not the oracle is replaced and lost his points.
    ///   - Get the timestamp for the round end.
    /// The return value is the maximum timestamp from all the coin pairs.
    /// @param oracleOwnerAddr Address of oracle owner
    /// @return the timestamp until which the funds must be locked.
    function onWithdraw(address oracleOwnerAddr) external returns (uint256);

    //////////////////////////////////////////////////////////////////////////////////// GETTERS USED BY COINPAIR
    /// @notice Used by the coin pair to get the oracle address from the oracleOwnerAddress.
    /// @param  oracleOwnerAddr the address of the owner of the oracle.
    /// @return oracleAddr Address of oracle
    function getOracleAddress(address oracleOwnerAddr) external view returns (address oracleAddr);

    /// @notice Returns true if oracle is registered.
    /// @param ownerAddr The address of the oracle's owner.
    function isRegistered(address ownerAddr) external view returns (bool);

    /// @notice Used by CoinPair
    /// @param oracleAddr The oracle address not the owner address.
    function getOracleOwner(address oracleAddr) external view returns (address);

    /// @notice Returns the amount of owners registered.
    function getRegisteredOraclesLen() external view returns (uint256);

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(
        uint256 idx
    ) external view returns (address ownerAddr, address oracleAddr, string memory url);

    //////////////////////////////////////////////////////////////////////////////////// GETTERS USED BY COINPAIR END

    //////////////////////////////////////////////////////////////////////////////////// GETTERS

    // TODO: Check what is the minimum amount of getters the python server needs.

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address ownerAddr, bytes32 coinPair) external view returns (bool);

    /// @notice Return true if the oracle is registered on this coin-pair
    /// @param ownerAddr addr The address of the Oracle check for.
    function isOracleRegistered(address ownerAddr) external view returns (bool);

    /// @notice Returns registration information for a registered Oracle.
    /// @param ownerAddr addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(
        address ownerAddr
    ) external view returns (string memory internetName, uint256 stake, address _owner);

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param ownerAddr address of the oracle to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(
        address ownerAddr,
        bytes32 coinpair
    ) external view returns (uint256 points, bool selectedInCurrentRound);

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the oracle address to lookup.
    function canRemoveOracle(address ownerAddr) external view returns (bool);

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param ownerAddr The address of the oracle.
    function getStake(address ownerAddr) external view returns (uint256 balance);

    //////////////////////////////////////////////////////////////////////////////////// GETTER TO LIST COIN PAIRS

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256);

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32);

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address);

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256);

    function getMaxStake(address[] calldata addresses) external view returns (address, uint256);

    //////////////////////////////////////////////////////////////////////////////////// GETTER TO LIST COIN PAIRS END

    // Public variable
    function getStakingContract() external view returns (IStakingMachine);

    // Public variable
    function getMinCPSubscriptionStake() external view returns (uint256);
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
  @notice Based on heavily on EnumberableSet, but with different contents.
  @dev An iterable mapping of addresses to Oracle struct, used to check oracles' data.
 */

library IterableOraclesLib {
    struct Oracle {
        address addr;
        string url;
    }

    struct IterableOraclesData {
        Oracle[] _values;
        // The key is the oracle Owner
        mapping(address => uint256) _indexes;
        // The key is the oracle Address, the value the owner
        mapping(address => address) registeredOwners;
    }

    /**
     * @dev Check if an oracle is registered
     * @return Bool
     */
    function _isOracleRegistered(
        IterableOraclesData storage self,
        address oracleAddr
    ) internal view returns (bool) {
        return self.registeredOwners[oracleAddr] != address(0);
    }

    /// @notice Check if an owner is registered
    function _isOwnerRegistered(
        IterableOraclesData storage self,
        address owner
    ) internal view returns (bool) {
        return self._indexes[owner] != 0;
    }

    /**
     * @dev Register oracle
     */
    function _registerOracle(
        IterableOraclesData storage self,
        address owner,
        address oracle,
        string memory url
    ) internal {
        require(owner != address(0), "Owner address cannot be 0x0");
        require(oracle != address(0), "Oracle address cannot be 0x0");
        require(!_isOwnerRegistered(self, owner), "Owner already registered");
        require(!_isOracleRegistered(self, oracle), "Oracle already registered");
        // Add oracle address
        self.registeredOwners[oracle] = owner;
        // EnumberableSet.add
        self._values.push(Oracle({addr: oracle, url: url}));
        // The value is stored at length-1, but we add 1 to all indexes and use 0 as a sentinel value
        self._indexes[owner] = self._values.length;
    }

    /**
     * @dev Remove oracle
     */
    function _removeOracle(IterableOraclesData storage self, address owner) internal {
        require(owner != address(0), "Owner address cannot be 0x0");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        uint256 toDeleteIndex = valueIndex - 1;
        // Delete oracle address entry
        address oracleAddr = self._values[toDeleteIndex].addr;

        // EnumberableSet.remove (almost)
        uint256 lastIndex = self._values.length - 1;
        Oracle memory lastValue = self._values[lastIndex];
        address lastOwner = self.registeredOwners[lastValue.addr];
        require(lastOwner != address(0), "Unexpected error");
        self._values[toDeleteIndex] = lastValue;
        self._indexes[lastOwner] = toDeleteIndex + 1;
        self._values.pop();
        delete self._indexes[owner];
        delete self.registeredOwners[oracleAddr];
    }

    /// @notice Sets oracle's name.
    function _setName(IterableOraclesData storage self, address owner, string memory url) internal {
        require(_isOwnerRegistered(self, owner), "Oracle owner is not registered");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        self._values[valueIndex - 1].url = url;
    }

    /// @notice Sets oracle's name.
    function _setOracleAddress(
        IterableOraclesData storage self,
        address owner,
        address oracleAddr
    ) internal {
        require(_isOwnerRegistered(self, owner), "Oracle owner is not registered");
        require(!_isOracleRegistered(self, oracleAddr), "Oracle already registered");
        require(owner != address(0), "Owner address cannot be 0x0");
        uint256 valueIndex = self._indexes[owner];
        require(valueIndex != 0, "Owner not registered");
        self._values[valueIndex - 1].addr = oracleAddr;
        self.registeredOwners[oracleAddr] = owner;
    }

    /// @notice Returns the amount of owners registered.
    function _getLen(IterableOraclesData storage self) internal view returns (uint256) {
        return self._values.length;
    }

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function _getOracleAtIndex(
        IterableOraclesData storage self,
        uint256 idx
    ) internal view returns (address ownerAddr, address oracleAddr, string memory url) {
        require(idx < self._values.length, "Illegal index");
        Oracle memory ret = self._values[idx];
        return (self.registeredOwners[ret.addr], ret.addr, ret.url);
    }

    /// @notice Returns address of oracle's owner.
    function _getOwner(
        IterableOraclesData storage self,
        address oracleAddr
    ) internal view returns (address) {
        return self.registeredOwners[oracleAddr];
    }

    /// @notice Returns oracle address.
    function _getOracleInfo(
        IterableOraclesData storage self,
        address owner
    ) internal view returns (address, string memory) {
        if (self._indexes[owner] == 0) {
            return (address(0), "");
        }
        Oracle memory ret = self._values[self._indexes[owner] - 1];
        return (ret.addr, ret.url);
    }

    /// @notice Returns oracle address.
    function _getOracleAddress(
        IterableOraclesData storage self,
        address owner
    ) internal view returns (address) {
        if (self._indexes[owner] == 0) {
            return address(0);
        }
        return self._values[self._indexes[owner] - 1].addr;
    }

    /// @notice Returns oracle's internet name.
    function _getInternetName(
        IterableOraclesData storage self,
        address owner
    ) internal view returns (bool found, string memory) {
        if (self._indexes[owner] == 0) {
            return (false, "");
        }
        return (true, self._values[self._indexes[owner] - 1].url);
    }
}

/*
    Basic public interface for the supporters smart contract.
    The facade for this contract is the StakingMachine, this interface is specifically for the scheduler
    that needs to call distribute() to distribute the rewards.
*/
interface ISupporters {
    //  generated by supporters::distribute() inside s.lib::_distribute()
    event PayEarnings(uint256 earnings, uint256 start, uint256 end);
    //  generated by supporters::_withdrawFromTo() //when last supporter exits case..
    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);
    // generated by supporters::stakeAt()
    //  supporters::stakeAtFrom()
    //  supporters::stakeAtFromInternal()
    event AddStake(
        address indexed user,
        address indexed subaccount,
        address indexed sender,
        uint256 amount,
        uint256 mocs
    );
    // generated by supporters::withdrawFrom()
    //  supporters::withdrawFromTo()
    event WithdrawStake(
        address indexed user,
        address indexed subaccount,
        address indexed destination,
        uint256 amount,
        uint256 mocs
    );

    //  defined in supporters.sol but not used there neither supporterslib.!!
    // event Withdraw(
    //     address indexed msgSender,
    //     address indexed subacount,
    //     address indexed receiver,
    //     uint256 mocs,
    //     uint256 blockNum
    // );

    /**
      @notice Deposit earnings that will be credited to supporters.
      @dev Earnings will be credited periodically through several blocks.
    */
    function distribute() external;

    /**
      @notice Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool);

    /// @notice The moc token address
    function mocToken() external view returns (IERC20);

    /**
     @notice Return the round length in blocks .
     @dev During each round rewards are collected and distributed during next round.

     @return Number of blocks to distribute earnings
    */
    function period() external view returns (uint256);

    // @notice total amount of mocs inside the supporters contract
    function totalMoc() external view returns (uint256);

    // @notice total amount of tokens inside the supporters contect.
    function totalToken() external view returns (uint256);

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getLockedBalance(address user) external view returns (uint256);

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    /// @return amount the amount of mocs locked
    /// @return untilTimestamp the timestamp that corresponds to the locking date.
    function getLockingInfo(
        address user
    ) external view returns (uint256 amount, uint256 untilTimestamp);

    /**
       @notice Amount of tokens for _user in a _subaccount.

       @param _user User address
       @param _subaccount subaccount to get balance
       @return tokens for _user at _subaccount
     */
    function getBalanceAt(address _user, address _subaccount) external view returns (uint256);

    /**
      @notice MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(address _user, address _subaccount) external view returns (uint256);

    /**
      @notice Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view returns (uint256);

    /**
       @notice Calculate locked earnings at a block

       @param _block Block used for calculations
       @return Locked amount of earnings in MOC
     */
    function getLockedAt(uint256 _block) external view returns (uint256);

    /**
      @notice Return information about earnings

      @return earnings Information about earnings
      @return distributed Currenty distributed
      @return next Will be distributed in next period
    */
    function getEarningsInfo()
        external
        view
        returns (uint256 earnings, uint256 distributed, uint256 next);

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() external view returns (uint256);

    /**
     @notice Returns the address at index.

     @param _idx index to query.
    */
    function getWhiteListAtIndex(uint256 _idx) external view returns (address);

    /**
     @notice Check if an account is whitelisted

     @param _account The account to check
    */
    function isWhitelisted(address _account) external view returns (bool);

    /**
      Convert amount MOC to equivalent in token

      @param _mocs Amount of MOC
      @return Equivalent amount of tokens
    */
    function mocToToken(uint256 _mocs) external view returns (uint256);

    /**
      Convert amount tokens to equivalent in MOCS

      @param _token Amount of tokens
      @return Equivalent amount of tokens
    */
    function tokenToMoc(uint256 _token) external view returns (uint256);

    /**
       Convert amount tokens to equivalent in MOCS ceiling up

       @param _token Amount of tokens
       @return Equivalent amount of tokens
     */
    function tokenToMocUP(uint256 _token) external view returns (uint256);
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

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract Supporters is SupportersStorage, ISupporters {
    using SafeMath for uint256;

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

    event Withdraw(
        address indexed msgSender,
        address indexed subacount,
        address indexed receiver,
        uint256 mocs,
        uint256 blockNum
    );

    /**
     @notice Contract creation

     @param _governor The address of the contract which governs this one
     @param _wlist Initial whitelist addresses
     @param _mocToken The address of the contract which governs this one
     @param _period The address of the contract which governs this one
    */
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        IERC20 _mocToken,
        uint256 _period
    ) external initializer {
        Governed._initialize(_governor);
        supportersData._initialize(_mocToken, _period);
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /// @notice Used by the voting machine to lock an amount of MOCs.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(
        address mocHolder,
        uint256 untilTimestamp
    ) external onlyWhitelisted(iterableWhitelistData) {
        LockingInfo storage lockedMocsInfo = lockedMocs[mocHolder];
        lockedMocsInfo.untilTimestamp = untilTimestamp;
        uint256 mocBalance = supportersData._getMOCBalanceAt(msg.sender, mocHolder);
        lockedMocsInfo.amount = mocBalance;
    }

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getLockedBalance(address user) external view override returns (uint256) {
        LockingInfo storage lockedMocsInfo = lockedMocs[user];
        return lockedMocsInfo.amount;
    }

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    /// @return amount the amount of mocs locked
    /// @return untilTimestamp the timestamp that corresponds to the locking date.
    function getLockingInfo(
        address user
    ) external view override returns (uint256 amount, uint256 untilTimestamp) {
        LockingInfo storage lockedMocsInfo = lockedMocs[user];
        return (lockedMocsInfo.amount, lockedMocsInfo.untilTimestamp);
    }

    /**
     @notice Add to the list of contracts that can stake in this contract

     @param  _whitelisted - the override coinPair
    */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     @notice Remove from the list of contracts that can stake in this contract

     @param _whitelisted - the override coinPair
    */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
    }

    /**
      @notice Deposit earnings that will be credited to supporters.
      @dev Earnings will be credited periodically through several blocks.
    */
    function distribute() external override {
        supportersData._distribute();
    }

    /**
      @notice Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view override returns (bool) {
        return supportersData._isReadyToDistribute();
    }

    /**
     Stake MOC to receive earnings on a subaccount.

     @param _mocs amount of MOC to stake
     @param _subaccount sub-account used to identify the stake
    */
    function stakeAt(
        uint256 _mocs,
        address _subaccount
    ) external onlyWhitelisted(iterableWhitelistData) {
        supportersData._stakeAtFrom(_mocs, _subaccount, msg.sender);
    }

    /**
     Stake MOC to receive earnings on a subaccount.

     @param _mocs amount of MOC to stake
     @param _subaccount sub-account used to identify the stake
     @param _sender sender account that must approve and from which the funds are taken
    */
    function stakeAtFrom(
        uint256 _mocs,
        address _subaccount,
        address _sender
    ) external onlyWhitelisted(iterableWhitelistData) {
        supportersData._stakeAtFrom(_mocs, _subaccount, _sender);
    }

    /**
     This function is for internal use, it doesn't force a price for the internal token.
     The idea is to let the code in the staking machine calculate the price relationship and take only the
     needed amount of mocs from the user.

     @param _tokens amount of tokens to stake
     @param _mocs amount of MOC to stake
     @param _subaccount sub-account used to identify the stake
     @param _sender sender account that must approve and from which the funds are taken
    */
    function stakeAtFromInternal(
        uint256 _tokens,
        uint256 _mocs,
        address _subaccount,
        address _sender
    ) external onlyWhitelisted(iterableWhitelistData) {
        supportersData._stakeAtFromInternal(_tokens, _mocs, _subaccount, _sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @return Amount of MOC transfered
    */
    function withdrawFrom(
        uint256 _tokens,
        address _subaccount
    )
        external
        onlyWhitelisted(iterableWhitelistData)
        stakeAvailable(msg.sender, _subaccount, _tokens)
        returns (uint256)
    {
        return supportersData._withdrawFromTo(_tokens, _subaccount, msg.sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function withdrawFromTo(
        uint256 _tokens,
        address _subaccount,
        address _receiver
    )
        external
        onlyWhitelisted(iterableWhitelistData)
        stakeAvailable(msg.sender, _subaccount, _tokens)
        returns (uint256)
    {
        return supportersData._withdrawFromTo(_tokens, _subaccount, _receiver);
    }

    /**
      @notice Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function getBalanceAt(
        address _user,
        address _subaccount
    ) external view override returns (uint256) {
        return supportersData._getBalanceAt(_user, _subaccount);
    }

    /**
      @notice MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(
        address _user,
        address _subaccount
    ) external view override returns (uint256) {
        return supportersData._getMOCBalanceAt(_user, _subaccount);
    }

    /**
      @notice Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view override returns (uint256) {
        return supportersData._getEarningsAt(_block);
    }

    /**
      @notice Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function getLockedAt(uint256 _block) external view override returns (uint256) {
        return supportersData._getLockedAt(_block);
    }

    /**
      @notice Return information about earnings

      @return Information about earnings
    */
    function getEarningsInfo() external view override returns (uint256, uint256, uint256) {
        return supportersData._getEarningsInfo();
    }

    /// @notice The moc token address
    function mocToken() external view override returns (IERC20) {
        return supportersData.mocToken;
    }

    /**
     @notice Return the round length in blocks .
     @dev During each round rewards are collected and distributed during next round.

     @return Number of blocks to distribute earnings
    */
    function period() external view override returns (uint256) {
        return supportersData.period;
    }

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() external view override returns (uint256) {
        return iterableWhitelistData._getWhiteListLen();
    }

    /**
     @notice Returns the address at index.

     @param _idx index to query.
    */
    function getWhiteListAtIndex(uint256 _idx) external view override returns (address) {
        return iterableWhitelistData._getWhiteListAtIndex(_idx);
    }

    /**
     @notice Check if an account is whitelisted

     @param _account The account to check
    */
    function isWhitelisted(address _account) external view override returns (bool) {
        return iterableWhitelistData._isWhitelisted(_account);
    }

    /**
      Convert amount MOC to equivalent in token

      @param _mocs Amount of MOC
      @return Equivalent amount of tokens
    */
    function mocToToken(uint256 _mocs) external view override returns (uint256) {
        return supportersData._mocToToken(_mocs);
    }

    /**
      Convert amount tokens to equivalent in MOCS

      @param _token Amount of tokens
      @return Equivalent amount of tokens
    */
    function tokenToMoc(uint256 _token) external view override returns (uint256) {
        return supportersData._tokenToMoc(_token);
    }

    /**
       Convert amount tokens to equivalent in MOCS ceiling up

       @param _token Amount of tokens
       @return Equivalent amount of tokens
     */
    function tokenToMocUP(uint256 _token) external view override returns (uint256) {
        return supportersData._tokenToMocUP(_token);
    }

    // @notice total amount of mocs inside the supporters contract
    function totalMoc() external view override returns (uint256) {
        return supportersData._getAvailableMOC();
    }

    // @notice total amount of tokens inside the supporters contect.
    function totalToken() external view override returns (uint256) {
        return supportersData._getTokens();
    }

    function getMaxMOCBalance(
        address owner,
        address[] calldata addresses
    ) external view returns (address selected, uint256 maxBalance) {
        if (addresses.length == 0) {
            return (selected, maxBalance);
        }

        selected = addresses[0];
        maxBalance = supportersData._getMOCBalanceAt(owner, addresses[0]);
        for (uint256 i = 1; i < addresses.length; i += 1) {
            if (addresses[i] == address(0)) {
                continue;
            }
            uint256 balance = supportersData._getMOCBalanceAt(owner, addresses[i]);
            if (balance > maxBalance) {
                maxBalance = balance;
                selected = addresses[i];
            }
        }

        return (selected, maxBalance);
    }

    /**
      @notice Modifier that checks locked stake for withdrawal availability
      @dev You should use this modifier in any function that withdraws a user's stake.
     */
    modifier stakeAvailable(
        address user,
        address subaccount,
        uint256 tokens
    ) {
        uint256 lockedAmount = 0;
        uint256 mocs = supportersData._tokenToMoc(tokens);
        LockingInfo storage lockedMocsInfo = lockedMocs[subaccount];
        uint256 mocBalance = supportersData._getMOCBalanceAt(user, subaccount);
        // solhint-disable-next-line not-rely-on-time
        if (block.timestamp < lockedMocsInfo.untilTimestamp) {
            lockedAmount = lockedMocsInfo.amount;
        }
        uint256 surplus = mocBalance.sub(lockedAmount);
        require(mocs <= surplus, "Stake not available for withdrawal.");
        _;
    }
}

/**
 * @dev Interface of the old MOC Oracle
 */
interface IPriceProvider {
    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek() external view returns (bytes32, bool);

    // Return the current price.
    function getPrice() external view returns (uint256);

    // Return if the price is not expired.
    function getIsValid() external view returns (bool);

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external view returns (uint256);

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        view
        returns (uint256 price, bool isValid, uint256 lastPubBlock);
}

/// @title PPrice
interface IPriceProviderRegisterEntry {
    enum IPriceProviderType {
        None,
        Published,
        Calculated
    }

    /// @notice return the type of provider
    function getPriceProviderType() external pure returns (IPriceProviderType);
}

/**
  @notice Manage round specific information
 */
library RoundInfoLib {
    using SafeMath for uint256;
    using AddressSetLib for AddressSetLib.AddressSet;

    /// Global registration information for each oracle, used by OracleManager
    struct RoundInfo {
        // Number of this round
        uint256 number;
        // Total points accumulated in round.
        uint256 totalPoints;
        // The starting block of period where this round is valid.
        uint256 startBlock;
        // The  timestamp where this round lock terminates (can be switched out).
        uint256 lockPeriodTimestamp;
        // The maximum count of oracles selected to participate each round
        uint256 maxOraclesPerRound;
        // The duration in secs before a SwitchRound can occur.
        uint256 roundLockPeriodSecs;
        // The selected oracles that participate in this round.
        AddressSetLib.AddressSet selectedOracles;
        // Per-oracle round Info.
        mapping(address => uint256) points;
    }

    /**
     * Initialize a register info structure
     */
    function initRoundInfo(
        uint256 _maxOraclesPerRound,
        uint256 _roundLockPeriod
    ) internal pure returns (RoundInfo memory) {
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(_roundLockPeriod > 0, "The round lock period must be positive and non zero");
        return
            RoundInfo({
                number: 1,
                totalPoints: 0,
                startBlock: 0,
                lockPeriodTimestamp: 0,
                maxOraclesPerRound: _maxOraclesPerRound,
                roundLockPeriodSecs: _roundLockPeriod,
                selectedOracles: AddressSetLib.init()
            });
    }

    function isFull(RoundInfo storage _self) internal view returns (bool) {
        return _self.selectedOracles.length() >= _self.maxOraclesPerRound;
    }

    function isSelected(RoundInfo storage _self, address _ownerAddr) internal view returns (bool) {
        return _self.selectedOracles.contains(_ownerAddr);
    }

    function length(RoundInfo storage _self) internal view returns (uint256) {
        return _self.selectedOracles.length();
    }

    function at(RoundInfo storage _self, uint256 idx) internal view returns (address) {
        return _self.selectedOracles.at(idx);
    }

    function contains(RoundInfo storage _self, address _ownerAddr) internal view returns (bool) {
        return _self.selectedOracles.contains(_ownerAddr);
    }

    function asArray(RoundInfo storage _self) internal view returns (address[] memory) {
        return _self.selectedOracles.asArray();
    }

    function addPoints(RoundInfo storage _self, address _oracleAddr, uint256 _points) internal {
        _self.points[_oracleAddr] = _self.points[_oracleAddr].add(_points);
        _self.totalPoints = _self.totalPoints + _points;
    }

    function addOracleToRound(RoundInfo storage _self, address _ownerAddr) internal {
        _self.selectedOracles.add(_ownerAddr);
    }

    function removeOracleFromRound(RoundInfo storage _self, address _ownerAddr) internal {
        _self.selectedOracles.remove(_ownerAddr);
        delete _self.points[_ownerAddr];
    }

    function isReadyToSwitch(RoundInfo storage _self) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp > _self.lockPeriodTimestamp;
    }

    function switchRound(RoundInfo storage _self) internal {
        for (uint256 i = 0; i < _self.selectedOracles.length(); i++) {
            delete _self.points[_self.selectedOracles.at(i)];
        }
        _self.number = _self.number + 1;
        _self.totalPoints = 0;
        _self.startBlock = block.number + 1;
        // solhint-disable-next-line not-rely-on-time
        _self.lockPeriodTimestamp = block.timestamp + 1 + _self.roundLockPeriodSecs;
        _self.selectedOracles.clear();
    }

    function getOracleRoundInfo(
        RoundInfo storage _self,
        address _ownerAddr
    ) internal view returns (uint256 points, bool selectedInCurrentRound) {
        return (_self.points[_ownerAddr], _self.selectedOracles.contains(_ownerAddr));
    }

    /// @notice Return current round information
    function getRoundInfo(
        RoundInfo storage _self
    )
        internal
        view
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOwners
        )
    {
        return (
            _self.number,
            _self.startBlock,
            _self.lockPeriodTimestamp,
            _self.totalPoints,
            asArray(_self)
        );
    }

    function getPoints(
        RoundInfo storage _self,
        address _oracleAddr
    ) internal view returns (uint256 points) {
        return _self.points[_oracleAddr];
    }
}

/**
  @notice Based on EnumberableSet, but with the ability to clear all the contents.
 */
library SubscribedOraclesLib {
    using SafeMath for uint256;
    using AddressSetLib for AddressSetLib.AddressSet;

    /// Global registration information for each oracle, used by OracleManager
    struct SubscribedOracles {
        AddressSetLib.AddressSet _inner;
    }

    function init() internal pure returns (SubscribedOracles memory) {
        return SubscribedOracles({_inner: AddressSetLib.init()});
    }

    /**
     * @dev Removes all value from a set. O(N).
     *
     */
    function clear(SubscribedOracles storage set) internal {
        set._inner.clear();
    }

    /**
     * @dev Get the minimum value.
     *
     */
    // prettier-ignore
    function getMin(
        SubscribedOracles storage set,
        function(address) external view returns (uint256) getStake
    ) internal view returns (uint256 minStake, address minVal) {
        if (length(set) == 0) {
            return (0, address(0));
        }
        minVal = at(set, 0);
        minStake = getStake(minVal);
        for (uint256 i = 1; i < length(set); i++) {
            address v = at(set, i);
            uint256 s = getStake(v);
            if (s < minStake) {
                minStake = s;
                minVal = v;
            }
        }
        return (minStake, minVal);
    }

    /**
     * @dev return a list of indexes that sorts the set by stake.
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    // prettier-ignore
    function sort(
        SubscribedOracles storage set,
        function(address) external view returns (uint256) getStake,
        uint256 count
    ) internal view returns (address[] memory selected) {
        if (count > length(set)) {
            count = length(set);
        }
        selected = new address[](count);
        if (count == 0) {
            return selected;
        }
        selected[0] = at(set, 0);
        for (uint256 i = 1; i < length(set); i++) {
            address v = at(set, i);
            uint256 vStake = getStake(v);
            uint256 j = i;
            if (j >= count) {
                j = count - 1;
                if (vStake <= getStake(selected[j])) {
                    continue;
                }
            }
            while (j > 0 && vStake > getStake(selected[j - 1])) {
                selected[j] = selected[j - 1];
                j--;
            }
            selected[j] = v;
        }
        return selected;
    }

    // prettier-ignore
    function getMaxUnselectedStake(
        SubscribedOracles storage set,
        function(address[] memory) external view returns (address, uint256) getMaxStake,
        AddressSetLib.AddressSet storage selectedOracles
    ) internal view returns (address, uint256) {
        uint256 len = length(set);
        address[] memory unselected = new address[](len);
        uint256 j = 0;
        for (uint256 i = 0; i < len; i++) {
            address c = at(set, i);
            if (selectedOracles.contains(c)) {
                continue;
            }
            unselected[j] = c;
            j += 1;
        }
        return getMaxStake(unselected);
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(SubscribedOracles storage set, address value) internal returns (bool) {
        return set._inner.add(value);
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(SubscribedOracles storage set, address value) internal returns (bool) {
        return set._inner.remove(value);
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(SubscribedOracles storage set, address value) internal view returns (bool) {
        return set._inner.contains(value);
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(SubscribedOracles storage set) internal view returns (uint256) {
        return set._inner.length();
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
    function at(SubscribedOracles storage set, uint256 index) internal view returns (address) {
        return set._inner.at(index);
    }

    /**
     * @dev Returns the set contents as an array
     */
    function asArray(
        SubscribedOracles storage set
    ) internal view returns (address[] memory selectedOracles) {
        return set._inner.asArray();
    }
}

/*
    Abstract contract meant to be reused with all the configurable parameters of CoinPairPrice.
*/
contract CoinPairPriceStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using RoundInfoLib for RoundInfoLib.RoundInfo;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // The publish message has a version field
    uint256 public constant PUBLISH_MESSAGE_VERSION = 3;

    // Maximum number of subscribed oracles.
    uint256 internal maxSubscribedOraclesPerRound;

    // Round information.
    RoundInfoLib.RoundInfo internal roundInfo;

    // The subscribed oracles to this coin-pair.
    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    // Whitelist used to store the addresses of contracts that can peek prices.
    IterableWhitelistLib.IterableWhitelistData internal pricePeekWhitelistData;

    // Whitelist used for emergency price publishing
    IterableWhitelistLib.IterableWhitelistData internal emergencyPublishWhitelistData;

    // The current price, accessible only by whitelisted contracts.
    uint256 internal currentPrice;

    // The coin-pair for which prices are reported in this contract.
    bytes32 internal coinPair;

    // The block where the last price publication occurred.
    uint256 internal lastPublicationBlock;

    // The amount of block during which a price is considered valid
    uint256 internal validPricePeriodInBlocks;

    // After emergencyPublishingPeriodInBlocks from last publication the emergency whitelisted oracles can publish
    uint256 internal emergencyPublishingPeriodInBlocks;

    OracleManager internal oracleManager;

    IERC20 internal token;

    IRegistry internal registry;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be called only by oracle manager
     */
    modifier onlyOracleManager() {
        require(msg.sender == address(oracleManager), "Oracle manager only");
        _;
    }
}

// Autogenerated by registryConstants.js
// solhint-disable func-name-mixedcase

contract RegistryConstants {
    // MOC_PROJECT_VERSION = keccak256(moc.project.version)
    bytes32 public constant MOC_PROJECT_VERSION =
        0xc1c87e0508bb8270ee6a6dbe630baa072e6e3d5968981666724b9333430e1c31;

    // MOC_TOKEN = keccak256(moc.token)
    bytes32 public constant MOC_TOKEN =
        0x4bd5e7ff929fdd1ba62a33f76e0f40e97bb35e8bf126c0d9d91ce5c69a4bc521;

    // MOC_DELAY_MACHINE = keccak256(moc.delay-machine)
    bytes32 public constant MOC_DELAY_MACHINE =
        0x66b60892ff6e7f0da16db27046f5960fdfd6bce5c3c8c21d56ccca3236a6281b;

    // MOC_STAKING_MACHINE = keccak256(moc.staking-machine)
    bytes32 public constant MOC_STAKING_MACHINE =
        0x3c557531fea67120f21bc7711270a96f1b8cff3dfe3dd798a8a9f09ce9b77972;

    // MOC_VESTING_MACHINE = keccak256(moc.vesting-machine)
    bytes32 public constant MOC_VESTING_MACHINE =
        0x7dfea4fb968e2599cdb7b3028c07d0188d0f92d1d00bd95c2805523c224649dd;

    // MOC_VOTING_MACHINE = keccak256(moc.voting-machine)
    bytes32 public constant MOC_VOTING_MACHINE =
        0xc0ded27704f62d8726fdbd83648113d9fd8cf32c09f80523d2ba523e0bbd5ba4;

    // MOC_UPGRADE_DELEGATOR = keccak256(moc.upgrade-delegator)
    bytes32 public constant MOC_UPGRADE_DELEGATOR =
        0x631bcbb9b033f9c8d13c32cf6e60827348d77b91b58c295e87745219242cca22;

    // MOC_PRICE_PROVIDER_REGISTRY = keccak256(moc.price-provider-registy)
    bytes32 public constant MOC_PRICE_PROVIDER_REGISTRY =
        0xd4ed72d0bf9bae5e1e7ae31a372a37c8069168889284ec94be25b3f6707f5b4a;

    // MOC_VOTING_MACHINE_MIN_STAKE = keccak256(moc.voting-machine.minStake)
    bytes32 public constant MOC_VOTING_MACHINE_MIN_STAKE =
        0x580be8e098dd1016787d59c2a534bf9df9ec679a29de4c8f92dc3807f7d7d54d;

    // MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA = keccak256(moc.voting-machine.preVoteExpirationTimeDelta)
    bytes32 public constant MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA =
        0x62f5dbf0c17b0df83487409f747ad2eeca5fd54c140ca59b32cf39d6f6eaf916;

    // MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS = keccak256(moc.voting-machine.maxPreProposals)
    bytes32 public constant MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS =
        0xc32b9cbc59039d297e670e7c196424308c90ba4a437fa7ccd008498c934e7dbf;

    // MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN = keccak256(moc.voting-machine.preVoteMinPCToWin)
    bytes32 public constant MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN =
        0x0a1b21dfd7e4f3741529cf579e2731e847d81bbf13a82d0eba6910d7ac4c1c0a;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO = keccak256(moc.voting-machine.voteMinPctToVeto)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO =
        0xfb2d33acd65c36f68a15f8fe41cb8c0dd1eda164ffa87c6882e685ccb1c1adfb;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM = keccak256(moc.voting-machine.voteMinPctForQuorum)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM =
        0xde1ede48948567c43c504b761af8cd6af5363fafeceb1239b3083955d809714f;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT = keccak256(moc.voting-machine.voteMinPctToAccept)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT =
        0x99f83ee0c57b325f3deafb536d55596743ff112c6ac0d853d5f4f89b75dec045;

    // MOC_VOTING_MACHINE_PCT_PRECISION = keccak256(moc.voting-machine.PCTPrecision)
    bytes32 public constant MOC_VOTING_MACHINE_PCT_PRECISION =
        0x73ee596441ef88c207a7a9147d62f59186b4991555e37b7ce9c801f9539d1050;

    // MOC_VOTING_MACHINE_VOTING_TIME_DELTA = keccak256(moc.voting-machine.votingTimeDelta)
    bytes32 public constant MOC_VOTING_MACHINE_VOTING_TIME_DELTA =
        0xb43ee0a5ee6dcc7115ce824e4e353526ad6e479afa4daeb78451070de942de36;

    // ORACLE_MANAGER_ADDR = keccak256(MOC_ORACLE\1\ORACLE_MANAGER_ADDR)
    bytes32 public constant ORACLE_MANAGER_ADDR =
        0x16986f74674f2ed21d50b6e74e6b12bb323ff4f72364542fd5de5104f3cc3ca9;

    // SUPPORTERS_ADDR = keccak256(MOC_ORACLE\1\SUPPORTERS_ADDR)
    bytes32 public constant SUPPORTERS_ADDR =
        0xe4f979504d2a7a24557a15195eb83131e7c4a66d33900454705435aa5a6ee086;

    // INFO_ADDR = keccak256(MOC_ORACLE\1\INFO_ADDR)
    bytes32 public constant INFO_ADDR =
        0xda9f12e01fc92de345bb741448d36ecb967052dd7aa1670439af833c9a3d78f1;

    // ORACLE_PRICE_FETCH_RATE = keccak256(MOC_ORACLE\1\ORACLE_PRICE_FETCH_RATE)
    bytes32 public constant ORACLE_PRICE_FETCH_RATE =
        0x945f72e5d44fb0ce3b1de393d19415723b79f97ad801089d8470d1c20e15ffef;

    // ORACLE_BLOCKCHAIN_INFO_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_BLOCKCHAIN_INFO_INTERVAL)
    bytes32 public constant ORACLE_BLOCKCHAIN_INFO_INTERVAL =
        0x11cfbdf601b80a575e4366f0234cc06de0c9f401fe250dd9dccfccefeedb6fc2;

    // ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL)
    bytes32 public constant ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL =
        0x2f271dc1fa81985bda14a2d6d0d60b45191d2a2d97e636b192696a8796d654a7;

    // ORACLE_MAIN_LOOP_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_MAIN_LOOP_TASK_INTERVAL)
    bytes32 public constant ORACLE_MAIN_LOOP_TASK_INTERVAL =
        0x275d8a46b817572476d2d55b41c7709dee307740bad676a9693805003a48d231;

    // ORACLE_PRICE_REJECT_DELTA_PCT = keccak256(MOC_ORACLE\1\ORACLE_PRICE_REJECT_DELTA_PCT)
    bytes32 public constant ORACLE_PRICE_REJECT_DELTA_PCT =
        0x7a3ee46ca1bd3e19089870d8d6530b083a86da93aab52efccb32d5950e2709cf;

    // ORACLE_CONFIGURATION_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_CONFIGURATION_TASK_INTERVAL)
    bytes32 public constant ORACLE_CONFIGURATION_TASK_INTERVAL =
        0xb027f2006a45346de89db4c5efc53f4e05e96532d27366aff00367a394d0abc4;

    // ORACLE_GATHER_SIGNATURE_TIMEOUT = keccak256(MOC_ORACLE\1\ORACLE_GATHER_SIGNATURE_TIMEOUT)
    bytes32 public constant ORACLE_GATHER_SIGNATURE_TIMEOUT =
        0xf75b08b2b912abdbb87cc459ca0b4fdc019329386ec84ab68399b0c86fed5a95;

    // ORACLE_MAIN_EXECUTOR_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_MAIN_EXECUTOR_TASK_INTERVAL)
    bytes32 public constant ORACLE_MAIN_EXECUTOR_TASK_INTERVAL =
        0xb324a91be1ac0d0c4888c835aee124ca1a7caf4b73ce10aa3504e2683865d7e5;

    // SCHEDULER_POOL_DELAY = keccak256(MOC_ORACLE\1\SCHEDULER_POOL_DELAY)
    bytes32 public constant SCHEDULER_POOL_DELAY =
        0x6c2abc911c0fa4c73b90c7143a9f4429749be45ebfe7b81e69b86e7ca440d811;

    // SCHEDULER_ROUND_DELAY = keccak256(MOC_ORACLE\1\SCHEDULER_ROUND_DELAY)
    bytes32 public constant SCHEDULER_ROUND_DELAY =
        0xa82bea7140872d1398fa0ab5075330ab0228f4c7e381b4b6502379ffc7cdcd9f;

    // ORACLE_PRICE_DIGITS = keccak256(MOC_ORACLE\1\ORACLE_PRICE_DIGITS)
    bytes32 public constant ORACLE_PRICE_DIGITS =
        0x4cd7e3f12ee4a2db0a6ba16e03fbc31bba1048c149bbf4fc9f3c02021ec550b8;

    // ORACLE_QUEUE_LEN = keccak256(MOC_ORACLE\1\ORACLE_QUEUE_LEN)
    bytes32 public constant ORACLE_QUEUE_LEN =
        0x7d32d87d65898c3cbc7e72c59d223bf61c7811e99dafafd24fb08e0a38f10914;

    // MESSAGE_VERSION = keccak256(MOC_ORACLE\1\MESSAGE_VERSION)
    bytes32 public constant MESSAGE_VERSION =
        0xeafac1a2b4d4fdcc942cbdce334a88ec83387087978d039f1320d3639a0b59df;

    // ORACLE_PRICE_DELTA_PCT = keccak256(MOC_ORACLE\1\ORACLE_PRICE_DELTA_PCT)
    bytes32 public constant ORACLE_PRICE_DELTA_PCT =
        0x41a2ac05b365409628009a8091d8dda06fe52fe2f1c792e651e5df7599a7a7de;

    // ORACLE_PRICE_PUBLISH_BLOCKS = keccak256(MOC_ORACLE\1\ORACLE_PRICE_PUBLISH_BLOCKS)
    bytes32 public constant ORACLE_PRICE_PUBLISH_BLOCKS =
        0x51a2be29a473202678b6cf57b717ba5d7ff671f01fdbdbfcad4e1882601b8896;

    // ORACLE_ENTERING_FALLBACKS_AMOUNTS = keccak256(MOC_ORACLE\1\ORACLE_ENTERING_FALLBACKS_AMOUNTS)
    bytes32 public constant ORACLE_ENTERING_FALLBACKS_AMOUNTS =
        0xf646c455329c7af0436f9e95c59c90ce0e11bb4e3a1deff805807798696adf88;

    // ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS = keccak256(MOC_ORACLE\1\ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS)
    bytes32 public constant ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS =
        0xef9006fe6663199909dfaa4ab45e3f86d6454adb7773682f356824b6b3bc6b0e;

    // ORACLE_MIN_ORACLES_PER_ROUND = keccak256(MOC_ORACLE\1\ORACLE_MIN_ORACLES_PER_ROUND)
    bytes32 public constant ORACLE_MIN_ORACLES_PER_ROUND =
        0xf5afc54dd2c3e35bfa15485ed117b621cf51f31f803d11be832ccde6c77a6b56;

    // MOC_FLOW_BUFFERS = keccak256(MOC_FLOW\1\BUFFERS)
    bytes32 public constant MOC_FLOW_BUFFERS =
        0x4cb845794d5472a713e41e8e4ddc566dab8d695f1dc6c8edd43dad9d55112a22;

    // MOC_FLOW_DRIPPERS = keccak256(MOC_FLOW\1\DRIPPERS)
    bytes32 public constant MOC_FLOW_DRIPPERS =
        0xdd6eacd9b2305faa48e6e500ef302cf28b8cd660dc843b355a6f5f26655eee73;

    // MOC_FLOW_COINERS = keccak256(MOC_FLOW\1\COINERS)
    bytes32 public constant MOC_FLOW_COINERS =
        0x8970fe7a53b9c3dfce4f2afec48b5a6550afcb16ea2da8a10ec4b47a83a34a9d;

    // MOC_FLOW_REVERSE_AUCTIONS = keccak256(MOC_FLOW\1\REVERSE_AUCTIONS)
    bytes32 public constant MOC_FLOW_REVERSE_AUCTIONS =
        0x0428ec087e0cce276a71d1caf1afe4da32a2d48b3ebe579040612b5bd262ff73;
}

library RegistryConstantsLib {
    function MOC_PROJECT_VERSION() internal pure returns (bytes32) {
        // keccak256(moc.project.version)
        return 0xc1c87e0508bb8270ee6a6dbe630baa072e6e3d5968981666724b9333430e1c31;
    }

    function MOC_TOKEN() internal pure returns (bytes32) {
        // keccak256(moc.token)
        return 0x4bd5e7ff929fdd1ba62a33f76e0f40e97bb35e8bf126c0d9d91ce5c69a4bc521;
    }

    function MOC_DELAY_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.delay-machine)
        return 0x66b60892ff6e7f0da16db27046f5960fdfd6bce5c3c8c21d56ccca3236a6281b;
    }

    function MOC_STAKING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.staking-machine)
        return 0x3c557531fea67120f21bc7711270a96f1b8cff3dfe3dd798a8a9f09ce9b77972;
    }

    function MOC_VESTING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.vesting-machine)
        return 0x7dfea4fb968e2599cdb7b3028c07d0188d0f92d1d00bd95c2805523c224649dd;
    }

    function MOC_VOTING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine)
        return 0xc0ded27704f62d8726fdbd83648113d9fd8cf32c09f80523d2ba523e0bbd5ba4;
    }

    function MOC_UPGRADE_DELEGATOR() internal pure returns (bytes32) {
        // keccak256(moc.upgrade-delegator)
        return 0x631bcbb9b033f9c8d13c32cf6e60827348d77b91b58c295e87745219242cca22;
    }

    function MOC_PRICE_PROVIDER_REGISTRY() internal pure returns (bytes32) {
        // keccak256(moc.price-provider-registy)
        return 0xd4ed72d0bf9bae5e1e7ae31a372a37c8069168889284ec94be25b3f6707f5b4a;
    }

    function MOC_VOTING_MACHINE_MIN_STAKE() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.minStake)
        return 0x580be8e098dd1016787d59c2a534bf9df9ec679a29de4c8f92dc3807f7d7d54d;
    }

    function MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.preVoteExpirationTimeDelta)
        return 0x62f5dbf0c17b0df83487409f747ad2eeca5fd54c140ca59b32cf39d6f6eaf916;
    }

    function MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.maxPreProposals)
        return 0xc32b9cbc59039d297e670e7c196424308c90ba4a437fa7ccd008498c934e7dbf;
    }

    function MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.preVoteMinPCToWin)
        return 0x0a1b21dfd7e4f3741529cf579e2731e847d81bbf13a82d0eba6910d7ac4c1c0a;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctToVeto)
        return 0xfb2d33acd65c36f68a15f8fe41cb8c0dd1eda164ffa87c6882e685ccb1c1adfb;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctForQuorum)
        return 0xde1ede48948567c43c504b761af8cd6af5363fafeceb1239b3083955d809714f;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctToAccept)
        return 0x99f83ee0c57b325f3deafb536d55596743ff112c6ac0d853d5f4f89b75dec045;
    }

    function MOC_VOTING_MACHINE_PCT_PRECISION() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.PCTPrecision)
        return 0x73ee596441ef88c207a7a9147d62f59186b4991555e37b7ce9c801f9539d1050;
    }

    function MOC_VOTING_MACHINE_VOTING_TIME_DELTA() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.votingTimeDelta)
        return 0xb43ee0a5ee6dcc7115ce824e4e353526ad6e479afa4daeb78451070de942de36;
    }

    function ORACLE_MANAGER_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MANAGER_ADDR)
        return 0x16986f74674f2ed21d50b6e74e6b12bb323ff4f72364542fd5de5104f3cc3ca9;
    }

    function SUPPORTERS_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SUPPORTERS_ADDR)
        return 0xe4f979504d2a7a24557a15195eb83131e7c4a66d33900454705435aa5a6ee086;
    }

    function INFO_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\INFO_ADDR)
        return 0xda9f12e01fc92de345bb741448d36ecb967052dd7aa1670439af833c9a3d78f1;
    }

    function ORACLE_PRICE_FETCH_RATE() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_FETCH_RATE)
        return 0x945f72e5d44fb0ce3b1de393d19415723b79f97ad801089d8470d1c20e15ffef;
    }

    function ORACLE_BLOCKCHAIN_INFO_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_BLOCKCHAIN_INFO_INTERVAL)
        return 0x11cfbdf601b80a575e4366f0234cc06de0c9f401fe250dd9dccfccefeedb6fc2;
    }

    function ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL)
        return 0x2f271dc1fa81985bda14a2d6d0d60b45191d2a2d97e636b192696a8796d654a7;
    }

    function ORACLE_MAIN_LOOP_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MAIN_LOOP_TASK_INTERVAL)
        return 0x275d8a46b817572476d2d55b41c7709dee307740bad676a9693805003a48d231;
    }

    function ORACLE_PRICE_REJECT_DELTA_PCT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_REJECT_DELTA_PCT)
        return 0x7a3ee46ca1bd3e19089870d8d6530b083a86da93aab52efccb32d5950e2709cf;
    }

    function ORACLE_CONFIGURATION_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_CONFIGURATION_TASK_INTERVAL)
        return 0xb027f2006a45346de89db4c5efc53f4e05e96532d27366aff00367a394d0abc4;
    }

    function ORACLE_GATHER_SIGNATURE_TIMEOUT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_GATHER_SIGNATURE_TIMEOUT)
        return 0xf75b08b2b912abdbb87cc459ca0b4fdc019329386ec84ab68399b0c86fed5a95;
    }

    function ORACLE_MAIN_EXECUTOR_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MAIN_EXECUTOR_TASK_INTERVAL)
        return 0xb324a91be1ac0d0c4888c835aee124ca1a7caf4b73ce10aa3504e2683865d7e5;
    }

    function SCHEDULER_POOL_DELAY() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SCHEDULER_POOL_DELAY)
        return 0x6c2abc911c0fa4c73b90c7143a9f4429749be45ebfe7b81e69b86e7ca440d811;
    }

    function SCHEDULER_ROUND_DELAY() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SCHEDULER_ROUND_DELAY)
        return 0xa82bea7140872d1398fa0ab5075330ab0228f4c7e381b4b6502379ffc7cdcd9f;
    }

    function ORACLE_PRICE_DIGITS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_DIGITS)
        return 0x4cd7e3f12ee4a2db0a6ba16e03fbc31bba1048c149bbf4fc9f3c02021ec550b8;
    }

    function ORACLE_QUEUE_LEN() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_QUEUE_LEN)
        return 0x7d32d87d65898c3cbc7e72c59d223bf61c7811e99dafafd24fb08e0a38f10914;
    }

    function MESSAGE_VERSION() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\MESSAGE_VERSION)
        return 0xeafac1a2b4d4fdcc942cbdce334a88ec83387087978d039f1320d3639a0b59df;
    }

    function ORACLE_PRICE_DELTA_PCT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_DELTA_PCT)
        return 0x41a2ac05b365409628009a8091d8dda06fe52fe2f1c792e651e5df7599a7a7de;
    }

    function ORACLE_PRICE_PUBLISH_BLOCKS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_PUBLISH_BLOCKS)
        return 0x51a2be29a473202678b6cf57b717ba5d7ff671f01fdbdbfcad4e1882601b8896;
    }

    function ORACLE_ENTERING_FALLBACKS_AMOUNTS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_ENTERING_FALLBACKS_AMOUNTS)
        return 0xf646c455329c7af0436f9e95c59c90ce0e11bb4e3a1deff805807798696adf88;
    }

    function ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS)
        return 0xef9006fe6663199909dfaa4ab45e3f86d6454adb7773682f356824b6b3bc6b0e;
    }

    function ORACLE_MIN_ORACLES_PER_ROUND() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MIN_ORACLES_PER_ROUND)
        return 0xf5afc54dd2c3e35bfa15485ed117b621cf51f31f803d11be832ccde6c77a6b56;
    }

    function MOC_FLOW_BUFFERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\BUFFERS)
        return 0x4cb845794d5472a713e41e8e4ddc566dab8d695f1dc6c8edd43dad9d55112a22;
    }

    function MOC_FLOW_DRIPPERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\DRIPPERS)
        return 0xdd6eacd9b2305faa48e6e500ef302cf28b8cd660dc843b355a6f5f26655eee73;
    }

    function MOC_FLOW_COINERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\COINERS)
        return 0x8970fe7a53b9c3dfce4f2afec48b5a6550afcb16ea2da8a10ec4b47a83a34a9d;
    }

    function MOC_FLOW_REVERSE_AUCTIONS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\REVERSE_AUCTIONS)
        return 0x0428ec087e0cce276a71d1caf1afe4da32a2d48b3ebe579040612b5bd262ff73;
    }
}

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is
    CoinPairPriceStorage,
    IPriceProvider,
    IPriceProviderRegisterEntry,
    ICoinPairPrice
{
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;
    using SafeMath for uint256;

    event OracleRewardTransfer(
        uint256 roundNumber,
        address oracleOwnerAddress,
        address toOwnerAddress,
        uint256 amount
    );
    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    event EmergencyPricePublished(
        address sender,
        uint256 price,
        address votedOracle,
        uint256 blockNumber
    );
    event NewRound(
        address caller,
        uint256 number,
        uint256 totalPoints,
        uint256 startBlock,
        uint256 lockPeriodTimestamp,
        address[] selectedOracles
    );

    /// @notice Construct a new contract
    /// @param _governor The governor address.
    /// @param _wlist List of whitelisted contracts (those that can get the price).
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _minOraclesPerRound The minimum count of oracles selected to participate each round
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _maxSubscribedOraclesPerRound The maximum count of subscribed oracles
    /// @param _roundLockPeriod The minimum time span for each round before a new one can be started, in secs.
    /// @param _validPricePeriodInBlocks The time span for which the last published price is valid.
    /// @param _emergencyPublishingPeriodInBlocks The number of blocks that must pass after a publication after which
    //          an emergency publishing must be enabled
    /// @param _bootstrapPrice A price to be set as a bootstraping value for this block
    /// @param _oracleManager The contract of the oracle manager.
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _maxSubscribedOraclesPerRound,
        uint256 _roundLockPeriod,
        uint256 _validPricePeriodInBlocks,
        uint256 _emergencyPublishingPeriodInBlocks,
        uint256 _bootstrapPrice,
        OracleManager _oracleManager,
        IRegistry _registry
    ) external initializer {
        require(_wlist.length != 0, "Whitelist must have at least one element");
        require(_coinPair != bytes32(0), "Coin pair must be valid");
        require(
            _tokenAddress != address(0),
            "The MOC token address must be provided in constructor"
        );
        require(
            _validPricePeriodInBlocks > 0,
            "The valid price period must be positive and non zero"
        );
        require(
            _emergencyPublishingPeriodInBlocks > 0,
            "The emergency publishing period must be positive and non zero"
        );

        Governed._initialize(_governor);

        for (uint256 i = 0; i < _wlist.length; i++) {
            pricePeekWhitelistData._addToWhitelist(_wlist[i]);
        }
        validPricePeriodInBlocks = _validPricePeriodInBlocks;
        emergencyPublishingPeriodInBlocks = _emergencyPublishingPeriodInBlocks;
        token = IERC20(_tokenAddress);
        coinPair = _coinPair;
        oracleManager = _oracleManager;
        registry = _registry;
        roundInfo = RoundInfoLib.initRoundInfo(_maxOraclesPerRound, _roundLockPeriod);
        maxSubscribedOraclesPerRound = _maxSubscribedOraclesPerRound;
        subscribedOracles = SubscribedOraclesLib.init();
        _publish(_bootstrapPrice);
    }

    /// @notice return the type of provider
    function getPriceProviderType() external pure override returns (IPriceProviderType) {
        return IPriceProviderType.Published;
    }

    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleOwnerAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleOwnerAddr) external override onlyOracleManager {
        require(
            !subscribedOracles.contains(oracleOwnerAddr),
            "Oracle is already subscribed to this coin pair"
        );
        uint256 ownerStake = oracleManager.getStake(oracleOwnerAddr);
        require(ownerStake >= oracleManager.getMinCPSubscriptionStake(), "Not enough stake");

        bool added = _addOrReplaceSubscribedOracle(oracleOwnerAddr);
        require(added, "Not enough stake to add");

        // If the round is not full, then add
        if (!roundInfo.isFull() && !roundInfo.isSelected(oracleOwnerAddr)) {
            roundInfo.addOracleToRound(oracleOwnerAddr);
        }
    }

    /// @notice Unsubscribe an oracle from this coin pair , disallowing it to be selected in rounds.
    /// @param oracleOwnerAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleOwnerAddr) external override onlyOracleManager {
        require(
            subscribedOracles.contains(oracleOwnerAddr),
            "Oracle is not subscribed to this coin pair"
        );

        subscribedOracles.remove(oracleOwnerAddr);
    }

    /// @notice The oracle owner has withdrawn some stake.
    /// Must check if the oracle is part of current round and if he lost his place with the
    /// new stake value (the stake is global and is saved in the supporters contract).
    /// @param oracleOwnerAddr the oracle owner that is trying to withdraw
    function onWithdraw(
        address oracleOwnerAddr
    ) external override onlyOracleManager returns (uint256) {
        if (!roundInfo.isSelected(oracleOwnerAddr)) {
            // not participating in current round, its ok to withdraw.
            return 0;
        }
        // If the current balance is lower than the unselected address that has the maximum stake
        // or it has less than the needed minimum, then the oracle is replaced.
        (address addr, uint256 otherStake) = subscribedOracles.getMaxUnselectedStake(
            oracleManager.getMaxStake,
            roundInfo.selectedOracles
        );
        uint256 minCPSubscriptionStake = oracleManager.getMinCPSubscriptionStake();
        uint256 ownerStake = oracleManager.getStake(oracleOwnerAddr);
        if (ownerStake < minCPSubscriptionStake || otherStake > ownerStake) {
            // The oracleOwnerAddr has lost his place in current round
            roundInfo.removeOracleFromRound(oracleOwnerAddr);
            if (addr != address(0)) {
                roundInfo.addOracleToRound(addr);
            }
        }
        // if not enough stake Unsubscribe directly
        if (ownerStake < minCPSubscriptionStake) {
            subscribedOracles.remove(oracleOwnerAddr);
        }

        if (roundInfo.lockPeriodTimestamp > block.timestamp) {
            return (roundInfo.lockPeriodTimestamp).sub(block.timestamp);
        } else {
            return 0;
        }
    }

    //
    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    function switchRound() external override {
        if (roundInfo.number > 0) {
            // Not before the first round
            require(roundInfo.isReadyToSwitch(), "The current round lock period is active");
            _distributeRewards();
        }

        // Setup new round parameters
        roundInfo.switchRound();

        // Select top stake oracles to participate on this round
        address[] memory selected = subscribedOracles.sort(
            oracleManager.getStake,
            roundInfo.maxOraclesPerRound
        );
        for (uint256 i = 0; i < selected.length && !roundInfo.isFull(); i++) {
            roundInfo.addOracleToRound(selected[i]);
        }
        emit NewRound(
            msg.sender,
            roundInfo.number,
            roundInfo.totalPoints,
            roundInfo.startBlock,
            roundInfo.lockPeriodTimestamp,
            roundInfo.asArray()
        );
    }

    /// @notice Publish a price.
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param _sigV The array of V-component of Oracle signatures.
    /// @param _sigR The array of R-component of Oracle signatures.
    /// @param _sigS The array of S-component of Oracle signatures.
    function publishPrice(
        uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external override {
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        require(roundInfo.number > 0, "Round not open");
        // require(subscribedOracles.contains(ownerAddr), "Sender oracle not subscribed");
        require(roundInfo.isSelected(ownerAddr), "Voter oracle is not part of this round");
        require(
            roundInfo.length() >= getMinOraclesPerRound(),
            "Minimum selected oracles required not reached"
        );
        require(msg.sender == _votedOracle, "Your address does not match the voted oracle");
        require(_version == PUBLISH_MESSAGE_VERSION, "This contract accepts only V3 format");
        require(_price > 0, "Price must be positive and non-zero");
        require(
            _blockNumber == lastPublicationBlock,
            "Blocknumber does not match the last publication block"
        );
        require(_coinpair == coinPair, "Coin pair - contract mismatch");

        // Verify signatures
        require(
            _sigS.length == _sigR.length && _sigR.length == _sigV.length,
            "Inconsistent signature count"
        );

        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData = abi.encodePacked(
            "\x19Ethereum Signed Message:\n148",
            _version,
            _coinpair,
            _price,
            _votedOracle,
            _blockNumber
        );
        bytes32 messageHash = keccak256(hData);

        uint256 validSigs = 0;
        address lastAddr = address(0);
        for (uint256 i = 0; i < _sigS.length; i++) {
            address rec = _recoverSigner(_sigV[i], _sigR[i], _sigS[i], messageHash);
            address ownerRec = oracleManager.getOracleOwner(rec);
            if (roundInfo.isSelected(ownerRec)) validSigs += 1;
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        require(
            validSigs > roundInfo.length() / 2,
            "Valid signatures count must exceed 50% of active oracles"
        );

        roundInfo.addPoints(ownerAddr, 1);
        _publish(_price);

        emit PricePublished(ownerAddr, _price, _votedOracle, _blockNumber);
    }

    /// @notice Publish a price without signature validation (when there is an emergecy!!!).
    /// @param _price Price to report.
    function emergencyPublish(
        uint256 _price
    ) external override onlyWhitelisted(emergencyPublishWhitelistData) {
        require(_price > 0, "Price must be positive and non-zero");
        require(
            block.number > lastPublicationBlock + emergencyPublishingPeriodInBlocks,
            "Emergency publish period didn't started"
        );

        _publish(_price);

        emit EmergencyPricePublished(msg.sender, _price, msg.sender, lastPublicationBlock);
    }

    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (bytes32, bool)
    {
        return (bytes32(currentPrice), _isValid());
    }

    /// @notice Return the current price
    function getPrice()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (uint256)
    {
        return currentPrice;
    }

    // Return if the price is not expired.
    function getIsValid() external view override returns (bool) {
        return _isValid();
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo() external view override returns (uint256, bool, uint256) {
        return (currentPrice, _isValid(), lastPublicationBlock);
    }

    // The maximum count of oracles selected to participate each round
    function maxOraclesPerRound() external view override returns (uint256) {
        return roundInfo.maxOraclesPerRound;
    }

    // The maximum count of oracles selected to participate each round
    function roundLockPeriodSecs() external view override returns (uint256) {
        return roundInfo.roundLockPeriodSecs;
    }

    function isRoundFull() external view returns (bool) {
        return roundInfo.isFull();
    }

    function isOracleInCurrentRound(address oracleOwnerAddr) external view override returns (bool) {
        return roundInfo.isSelected(oracleOwnerAddr);
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleOwnerAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleOwnerAddr) external view override returns (bool) {
        return subscribedOracles.contains(oracleOwnerAddr);
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() external view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Return current round information
    function getRoundInfo()
        external
        view
        override
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOwners,
            address[] memory selectedOracles
        )
    {
        (round, startBlock, lockPeriodTimestamp, totalPoints, selectedOwners) = roundInfo
            .getRoundInfo();
        selectedOracles = new address[](selectedOwners.length);
        for (uint256 i = 0; i < selectedOwners.length; i++) {
            selectedOracles[i] = oracleManager.getOracleAddress(selectedOwners[i]);
        }
    }

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(
        address oracleOwner
    ) external view override returns (uint256 points, bool selectedInCurrentRound) {
        return roundInfo.getOracleRoundInfo(oracleOwner);
    }

    /// @notice Returns the amount of oracles subscribed to this coin pair.
    function getSubscribedOraclesLen() external view override returns (uint256) {
        return subscribedOracles.length();
    }

    /// @notice Returns the oracle owner address that is subscribed to this coin pair
    /// @param idx index to query.
    function getSubscribedOracleAtIndex(
        uint256 idx
    ) external view override returns (address ownerAddr) {
        return subscribedOracles.at(idx);
    }

    // Public variable
    function getMaxSubscribedOraclesPerRound() external view override returns (uint256) {
        return maxSubscribedOraclesPerRound;
    }

    // Public variable
    function getCoinPair() external view override returns (bytes32) {
        return coinPair;
    }

    // Public variable
    function getLastPublicationBlock()
        external
        view
        override(IPriceProvider, ICoinPairPrice)
        returns (uint256)
    {
        return lastPublicationBlock;
    }

    // Public variable
    function getValidPricePeriodInBlocks() external view override returns (uint256) {
        return validPricePeriodInBlocks;
    }

    // Public variable
    function getEmergencyPublishingPeriodInBlocks() external view override returns (uint256) {
        return emergencyPublishingPeriodInBlocks;
    }

    // Public variable
    function getOracleManager() external view override returns (IOracleManager) {
        return IOracleManager(oracleManager);
    }

    // Public variable
    function getToken() external view override returns (IERC20) {
        return token;
    }

    // Public variable
    function getRegistry() external view override returns (IRegistry) {
        return registry;
    }

    // Public value from Registry:
    //   The minimum count of oracles selected to participate each round
    function getMinOraclesPerRound() public view override returns (uint256) {
        return this.getRegistry().getUint(RegistryConstantsLib.ORACLE_MIN_ORACLES_PER_ROUND());
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    /// @notice return true if the price is valid
    function _isValid() private view returns (bool) {
        require(block.number >= lastPublicationBlock, "Wrong lastPublicationBlock");
        return (block.number - lastPublicationBlock) < validPricePeriodInBlocks;
    }

    /// @notice add or replace and oracle from the subscribed list of oracles.
    function _addOrReplaceSubscribedOracle(address oracleOwnerAddr) internal returns (bool) {
        if (subscribedOracles.length() < maxSubscribedOraclesPerRound) {
            return subscribedOracles.add(oracleOwnerAddr);
        }
        (uint256 minStake, address minVal) = subscribedOracles.getMin(oracleManager.getStake);
        uint256 vStake = oracleManager.getStake(oracleOwnerAddr);
        if (vStake > minStake) {
            if (subscribedOracles.remove(minVal)) {
                return subscribedOracles.add(oracleOwnerAddr);
            }
        }
        return false;
    }

    /// @notice Distribute rewards to oracles, taking fees from this smart contract.
    function _distributeRewards() private {
        if (roundInfo.totalPoints == 0) return;
        uint256 availableRewardFees = token.balanceOf(address(this));
        if (availableRewardFees == 0) return;

        // Distribute according to points/TotalPoints ratio
        for (uint256 i = 0; i < roundInfo.length(); i++) {
            address oracleOwnerAddr = roundInfo.at(i);
            uint256 points = roundInfo.getPoints(oracleOwnerAddr);
            if (points == 0) {
                continue;
            }
            uint256 distAmount = ((points).mul(availableRewardFees)).div(roundInfo.totalPoints);
            require(token.transfer(oracleOwnerAddr, distAmount), "Token transfer failed");
            emit OracleRewardTransfer(
                roundInfo.number,
                oracleOwnerAddr,
                oracleOwnerAddr,
                distAmount
            );
        }
    }

    // @notice publish a price, called only after verification.
    function _publish(uint256 _price) private {
        lastPublicationBlock = block.number;
        currentPrice = _price;
    }

    /// @notice Recover signer address from v,r,s signature components and hash
    ///
    function _recoverSigner(
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 hash
    ) private pure returns (address) {
        uint8 v0 = v;

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v0 < 27) {
            v0 += 27;
        }

        // If the version is correct return the signer address
        require(v0 == 27 || v0 == 28, "Cannot recover signature");
        return ecrecover(hash, v0, r, s);
    }
}

contract StakingStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    Supporters internal supporters;
    IOracleManager internal oracleManager;
    IERC20 internal mocToken;
    IDelayMachine internal delayMachine;

    // A fixed amount of lock time that is added to withdraws.
    uint256 internal withdrawLockTime;

    // Whitelisted contracts that can lock stake.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistDataLock;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}

contract Staking is StakingStorage, IStakingMachine, IStakingMachineOracles {
    using SafeMath for uint256;

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be called only by the delay machine
     */
    modifier delayMachineOnly() {
        require(msg.sender == address(delayMachine), "delayMachineOnly");
        _;
    }

    // -----------------------------------------------------------------------
    //
    //   Public interface
    //
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    //   Staking
    // -----------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _governor The address of the contract which governs this one
    /// @param _supporters the Supporters contract contract address.
    /// @param _oracleManager the Oracle Manager contract contract address.
    /// @param _delayMachine the Delay Machine contract contract address.
    /// @param _wlistlock Initial whitelist addresses for locking mocs
    function initialize(
        IGovernor _governor,
        Supporters _supporters,
        IOracleManager _oracleManager,
        IDelayMachine _delayMachine,
        address[] calldata _wlistlock,
        uint256 _withdrawLockTime
    ) external initializer {
        Governed._initialize(_governor);
        oracleManager = _oracleManager;
        supporters = _supporters;
        mocToken = _supporters.mocToken();
        delayMachine = _delayMachine;
        withdrawLockTime = _withdrawLockTime;
        for (uint256 i = 0; i < _wlistlock.length; i++) {
            iterableWhitelistDataLock._addToWhitelist(_wlistlock[i]);
        }
    }

    /// @notice Used by the voting machine to lock an amount of MOCs.
    /// Delegates to the Supporters smart contract.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(
        address mocHolder,
        uint256 untilTimestamp
    ) external override onlyWhitelisted(iterableWhitelistDataLock) {
        supporters.lockMocs(mocHolder, untilTimestamp);
    }

    /// @notice Accept a deposit from an account.
    /// Delegates to the Supporters smart contract.
    /// @param mocs token quantity
    function deposit(uint256 mocs) external override {
        deposit(mocs, msg.sender);
    }

    /// @notice Accept a deposit from an account.
    /// Delegates to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    function deposit(uint256 mocs, address destination) public override {
        require(destination == msg.sender, "FIX: Only sender");
        _depositFrom(mocs, destination, msg.sender);
    }

    /// @notice Accept a deposit from an account.
    /// Delegates to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    /// @param source the address that approved the transfer
    function depositFrom(
        uint256 mocs,
        address destination,
        address source
    ) public override delayMachineOnly {
        _depositFrom(mocs, destination, source);
    }

    /// @notice Accept a deposit from an account.
    /// Delegates to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    /// @param source the address that approved the transfer
    function _depositFrom(uint256 mocs, address destination, address source) internal {
        // Floor(mocs * totalTokens /  totalMocs)
        uint256 _tokens = supporters.mocToToken(mocs);
        // require(_tokens > 0, "Not enough mocs");
        if (_tokens == 0) {
            // Not enough mocs, just return
            return;
        }

        // Ceil(_tokens * totalMocs / totalTokens)
        uint256 _mocs = supporters.tokenToMocUP(_tokens);
        // This is a special case that happen when there are no mocs in the
        // system (in this case the moc/token relation is 1/1).
        if (_mocs == 0) {
            _mocs = _tokens;
        }

        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(source, address(this), _mocs), "error in transferFrom");
        // Stake at Supporters contract
        require(mocToken.approve(address(supporters), _mocs), "error in approve");
        supporters.stakeAtFromInternal(_tokens, _mocs, destination, address(this));
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param _mocs token quantity
    function withdraw(uint256 _mocs) external override {
        uint256 tokens = supporters.mocToToken(_mocs);
        withdrawTokens(tokens);
    }

    /// @notice Withdraw all the stake and send it to the delay machine.
    function withdrawAll() external override {
        uint256 tokens = supporters.getBalanceAt(address(this), msg.sender);
        withdrawTokens(tokens);
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param tokens token quantity
    function withdrawTokens(uint256 tokens) public {
        uint256 mocs = supporters.withdrawFromTo(tokens, msg.sender, address(this));
        // Approve stake transfer for Delay Machine contract
        require(mocToken.approve(address(delayMachine), mocs), "error in approve");
        uint256 expiration = oracleManager.onWithdraw(msg.sender);
        delayMachine.deposit(mocs, msg.sender, expiration.add(withdrawLockTime));
    }

    /// @notice Get the value of the token, withdraw and deposit can be done only in multiples of the token value.
    function totalMoc() external view returns (uint256) {
        return supporters.totalMoc();
    }

    function totalToken() external view returns (uint256) {
        return supporters.totalToken();
    }

    /// @notice Reports the balance of MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getBalance(address user) external view override returns (uint256) {
        return supporters.getMOCBalanceAt(address(this), user);
    }

    /// @notice Reports the balance of tokens for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getTokenBalance(address user) external view override returns (uint256) {
        return supporters.getBalanceAt(address(this), user);
    }

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getLockedBalance(address user) external view override returns (uint256) {
        return supporters.getLockedBalance(user);
    }

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    /// @return amount the amount of mocs locked
    /// @return untilTimestamp the timestamp that corresponds to the locking date.
    function getLockingInfo(
        address user
    ) external view override returns (uint256 amount, uint256 untilTimestamp) {
        (amount, untilTimestamp) = supporters.getLockingInfo(user);
    }

    // -----------------------------------------------------------------------
    //   Oracles
    // -----------------------------------------------------------------------

    /// @notice Returns the amount of owners registered.
    /// Delegates to the Oracle Manager smart contract.
    function getRegisteredOraclesLen() external view override returns (uint256) {
        return oracleManager.getRegisteredOraclesLen();
    }

    /// @notice Returns the oracle name and address at index.
    /// Delegates to the Oracle Manager smart contract.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(
        uint256 idx
    ) external view override returns (address ownerAddr, address oracleAddr, string memory url) {
        return oracleManager.getRegisteredOracleAtIndex(idx);
    }

    /// @notice Set an oracle's name (url) and address.
    /// Delegates to the Oracle Manager smart contract.
    /// @param oracleAddr address of the oracle (from which we publish prices)
    /// @param url url used by the oracle server
    function registerOracle(address oracleAddr, string calldata url) external override {
        oracleManager.registerOracle(msg.sender, oracleAddr, url);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param url The new url to set.
    function setOracleName(string calldata url) external override {
        oracleManager.setOracleName(msg.sender, url);
    }

    /// @notice Change the oracle address
    /// @param oracleAddr The new oracle address
    function setOracleAddress(address oracleAddr) external override {
        oracleManager.setOracleAddress(msg.sender, oracleAddr);
    }

    /// @notice Return true if the oracle is registered.
    /// @param ownerAddr The address of the owner of the Oracle to check for.
    function isOracleRegistered(address ownerAddr) external view override returns (bool) {
        return oracleManager.isOracleRegistered(ownerAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function canRemoveOracle(address ownerAddr) external view override returns (bool) {
        return oracleManager.canRemoveOracle(ownerAddr);
    }

    /// @notice Remove an oracle.
    /// Delegates to the Oracle Manager smart contract.
    function removeOracle() external override {
        oracleManager.removeOracle(msg.sender);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view override returns (uint256) {
        return oracleManager.getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view override returns (bytes32) {
        return oracleManager.getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinPair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinPair) external view override returns (address) {
        return oracleManager.getContractAddress(coinPair);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(
        bytes32 coinPair,
        uint256 hint
    ) external view override returns (uint256) {
        return oracleManager.getCoinPairIndex(coinPair, hint);
    }

    /// @notice Subscribe an oracle to a coin pair.
    /// Delegates to the Oracle Manager smart contract.
    /// @param coinPair coin pair to subscribe, for example BTCUSD
    function subscribeToCoinPair(bytes32 coinPair) external override {
        oracleManager.subscribeToCoinPair(msg.sender, coinPair);
    }

    /// @notice Unsubscribe an oracle from a coin pair.
    /// Delegates to the Oracle Manager smart contract.
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function unSubscribeFromCoinPair(bytes32 coinPair) external override {
        oracleManager.unSubscribeFromCoinPair(msg.sender, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    /// @param ownerAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function isSubscribed(
        address ownerAddr,
        bytes32 coinPair
    ) external view override returns (bool) {
        return oracleManager.isSubscribed(ownerAddr, coinPair);
    }

    function getMaxBalance(address[] calldata addresses) external view returns (address, uint256) {
        return supporters.getMaxMOCBalance(address(this), addresses);
    }

    // Public variable
    function getSupporters() external view override returns (address) {
        return address(supporters);
    }

    // Public variable
    function getOracleManager() external view override returns (IOracleManager) {
        return oracleManager;
    }

    // Public variable
    function getMocToken() external view override returns (IERC20) {
        return mocToken;
    }

    // Public variable
    function getDelayMachine() external view override returns (IDelayMachine) {
        return delayMachine;
    }

    // Public variable
    function getWithdrawLockTime() external view override returns (uint256) {
        return withdrawLockTime;
    }
}

/// @title This contract registers which CoinPairPrice contract will serve
///        prices for a particular coin-pair. Clients can query coin-pair
///        data and associated contract addresses.
library CoinPairRegisterLib {
    struct CoinPairRegisterData {
        mapping(bytes32 => address) coinPairMap;
        bytes32[] coinPairList;
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _registerCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        address addr
    ) internal {
        require(addr != address(0), "Address cannot be zero");
        require(self.coinPairMap[coinPair] == address(0x0), "Pair is already registered");
        self.coinPairMap[coinPair] = addr;
        self.coinPairList.push(coinPair);
    }

    /// @notice Unregister a coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array.
    function _unRegisterCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        uint256 hint
    ) internal {
        require(self.coinPairMap[coinPair] != address(0x0), "Pair is already unregistered");
        uint256 idx = _getCoinPairIndex(self, coinPair, hint);
        require(idx < self.coinPairList.length, "Coin pair not found");
        delete self.coinPairMap[coinPair];
        self.coinPairList[idx] = self.coinPairList[self.coinPairList.length - 1];
        self.coinPairList.pop();
    }

    /// @notice Set the address for a coinpair (the old one is lost!!!!)
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function _setCoinPair(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        address addr
    ) internal {
        require(addr != address(0), "Address cannot be zero");
        require(self.coinPairMap[coinPair] != address(0x0), "This coin pair is not registered");
        self.coinPairMap[coinPair] = addr;
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getContractAddress(
        CoinPairRegisterData storage self,
        bytes32 coinpair
    ) internal view returns (address) {
        return self.coinPairMap[coinpair];
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function _getCoinPairCount(CoinPairRegisterData storage self) internal view returns (uint256) {
        return self.coinPairList.length;
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function _getCoinPairAtIndex(
        CoinPairRegisterData storage self,
        uint256 i
    ) internal view returns (bytes32) {
        require(i < self.coinPairList.length, "Illegal index");
        return self.coinPairList[i];
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function _getCoinPairIndex(
        CoinPairRegisterData storage self,
        bytes32 coinPair,
        uint256 hint
    ) internal view returns (uint256) {
        require(hint < self.coinPairList.length, "Illegal index");
        for (uint256 i = hint; i < self.coinPairList.length; i++) {
            if (self.coinPairList[i] == coinPair) {
                return i;
            }
        }
        return self.coinPairList.length;
    }
}

contract OracleManagerStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using IterableOraclesLib for IterableOraclesLib.IterableOraclesData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // Whitelisted contracts that can operate oracles in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    // Coin pair register
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Registered oracles
    IterableOraclesLib.IterableOraclesData internal registeredOracles;

    // Staking contract that manages stake
    Staking internal stakingContract;

    // Minimum coin pair subscription stake
    uint256 internal minCPSubscriptionStake;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;

    /**
    @notice Modifier that protects the function
    @dev You should use this modifier in any function that should be called through the governance system
    or a whitelisted  contract
     */
    modifier authorizedChangerOrWhitelisted() {
        require(
            iterableWhitelistData._isWhitelisted(msg.sender) ||
                governor.isAuthorizedChanger(msg.sender),
            "Address is not whitelisted"
        );
        _;
    }
}

contract OracleManager is OracleManagerStorage, IOracleManager {
    using SafeMath for uint256;

    event OracleRegistered(address caller, address addr, string internetName);
    event OracleStakeAdded(address caller, address addr, uint256 stake);
    event OracleSubscribed(address caller, bytes32 coinpair);
    event OracleUnsubscribed(address caller, bytes32 coinpair);
    event OracleRemoved(address caller);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _governor The address of the contract which governs this one
    /// @param _minCPSubscriptionStake The minimum amount of tokens required as stake for a coin pair subscription.
    /// @param _stakingContract the Staking contract address.
    /// @param _wlist whitelisted contract that can call this one (usually only staking).
    function initialize(
        IGovernor _governor,
        uint256 _minCPSubscriptionStake,
        Staking _stakingContract,
        address[] calldata _wlist
    ) external initializer {
        require(address(_stakingContract) != address(0), "Staking contract address must be != 0");
        require(
            _minCPSubscriptionStake > 0,
            "The minimum coin pair subscription stake amount cannot be zero"
        );

        Governed._initialize(_governor);
        stakingContract = _stakingContract;

        minCPSubscriptionStake = _minCPSubscriptionStake;
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(
        bytes32 coinPair,
        address addr
    ) external override onlyAuthorizedChanger {
        coinPairRegisterData._registerCoinPair(coinPair, addr);
    }

    /**
     @notice Add to the list of contracts that can stake in this contract

     @param  _whitelisted - the override coinPair
    */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     @notice Remove from the list of contracts that can stake in this contract

     @param _whitelisted - the override coinPair
    */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
    }

    /// @notice Registers an oracle in the system.
    /// @param ownerAddr Address of the Oracle's owner.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(
        address ownerAddr,
        address oracleAddr,
        string calldata internetName
    ) external override onlyWhitelisted(iterableWhitelistData) {
        registeredOracles._registerOracle(ownerAddr, oracleAddr, internetName);
        emit OracleRegistered(ownerAddr, oracleAddr, internetName);
    }

    /// @notice The oracle owner did a partial withdrawal of funds
    /// 1. The oracle address is searched by the owner address.
    /// 2. Each coin pair to which the oracle is subscribed is consulted to:
    ///   - Check if the new amount is enough to stay in the current round.
    ///       If not the oracle is replaced and lost his points.
    ///   - Get the timestamp for the round end.
    /// The return value is the maximum timestamp from all the coin pairs.
    /// @param oracleOwnerAddr Address of oracle owner
    /// @return the timestamp until which the funds must be locked.
    function onWithdraw(
        address oracleOwnerAddr
    ) external override onlyWhitelisted(iterableWhitelistData) returns (uint256) {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        uint256 timestamp = 0;
        uint256 maxTimestamp = 0;
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            timestamp = cp.onWithdraw(oracleOwnerAddr);
            if (timestamp > maxTimestamp) {
                maxTimestamp = timestamp;
            }
        }
        return maxTimestamp;
    }

    /// @notice Used by the coin pair to get the oracle address from the oracleOwnerAddress.
    /// @param  oracleOwnerAddr the address of the owner of the oracle.
    /// @return oracleAddr Address of oracle
    function getOracleAddress(
        address oracleOwnerAddr
    ) public view override returns (address oracleAddr) {
        return registeredOracles._getOracleAddress(oracleOwnerAddr);
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function subscribeToCoinPair(
        address ownerAddr,
        bytes32 coinPair
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(ownerAddr);

        emit OracleSubscribed(ownerAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function unSubscribeFromCoinPair(
        address ownerAddr,
        bytes32 coinPair
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(ownerAddr);

        emit OracleUnsubscribed(ownerAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(
        address ownerAddr,
        bytes32 coinPair
    ) external view override returns (bool) {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        return ctAddr.isSubscribed(ownerAddr);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param ownerAddr Address of message sender
    /// @param name The new name to set.
    function setOracleName(
        address ownerAddr,
        string calldata name
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setName(ownerAddr, name);
    }

    /// @notice Change the oracle address
    /// @param ownerAddr Address of message sender
    /// @param oracleAddr The new oracle address
    function setOracleAddress(
        address ownerAddr,
        address oracleAddr
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setOracleAddress(ownerAddr, oracleAddr);
    }

    /// @notice Return true if the oracle is registered in the contract
    /// @param ownerAddr The address of the owner of the Oracle to check for.
    function isOracleRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param ownerAddr address of the oracle owner to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(
        address ownerAddr,
        bytes32 coinpair
    ) external view override returns (uint256 points, bool selectedInCurrentRound) {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinpair);
        (points, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(ownerAddr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param ownerAddr Address of message sender
    function removeOracle(address ownerAddr) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        _unsubscribeAll(ownerAddr);
        require(_canRemoveOracle(ownerAddr), "Not ready to remove");
        registeredOracles._removeOracle(ownerAddr);
        emit OracleRemoved(ownerAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function canRemoveOracle(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr) && _canRemoveOracle(ownerAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param ownerAddr The address of the oracle's owner.
    function getStake(address ownerAddr) public view override returns (uint256 balance) {
        return stakingContract.getBalance(ownerAddr);
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param ownerAddr The address of the oracle's owner.
    function getOracleRegistrationInfo(
        address ownerAddr
    )
        external
        view
        override
        returns (string memory internetName, uint256 stake, address oracleAddr)
    {
        (oracleAddr, internetName) = registeredOracles._getOracleInfo(ownerAddr);
        stake = getStake(ownerAddr);
    }

    /// @notice Returns true if oracle is registered.
    /// @param ownerAddr The address of the oracle's owner.
    function isRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Used by CoinPair
    /// @param oracleAddr The oracle address not the owner address.
    function getOracleOwner(address oracleAddr) external view override returns (address) {
        return registeredOracles._getOwner(oracleAddr);
    }

    /// @notice Returns the amount of owners registered.
    function getRegisteredOraclesLen() external view override returns (uint256) {
        return registeredOracles._getLen();
    }

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(
        uint256 idx
    ) external view override returns (address ownerAddr, address oracleAddr, string memory url) {
        return registeredOracles._getOracleAtIndex(idx);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view override returns (uint256) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view override returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view override returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    function getMaxStake(
        address[] calldata addresses
    ) external view override returns (address, uint256) {
        return stakingContract.getMaxBalance(addresses);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(
        bytes32 coinPair,
        uint256 hint
    ) external view override returns (uint256) {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }

    // Public variable
    function getStakingContract() external view override returns (IStakingMachine) {
        return stakingContract;
    }

    // Public variable
    function getMinCPSubscriptionStake() external view override returns (uint256) {
        return minCPSubscriptionStake;
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function _canRemoveOracle(address ownerAddr) private view returns (bool) {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isOracleInCurrentRound(ownerAddr)) {
                return false;
            }
        }
        return true;
    }

    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param ownerAddr Address of the oracle owner.
    function _unsubscribeAll(address ownerAddr) private {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isSubscribed(ownerAddr)) {
                cp.unsubscribe(ownerAddr);
            }
        }
    }

    // A change contract can act as the owner of an Oracle
    /// @param oracleOwner Message sender's address
    function _isOwnerRegistered(address oracleOwner) private view returns (bool) {
        return registeredOracles._isOwnerRegistered(oracleOwner);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }
}

/// @title A registry for the coin pair prices, this is more general than OracleManager that stores
/// only the coin pairs that are published by oracles.
contract PriceProviderRegisterStorage is Initializable, Governed {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;

    // Coin Pair register, has the same entries as OracleManage + calculated prices.
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}

/// @title A registry for the coin pair prices, this is more general than OracleManager that stores
/// only the coin pairs that are published by oracles.
contract PriceProviderRegister is PriceProviderRegisterStorage {
    using SafeMath for uint256;

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(
        bytes32 coinPair,
        IPriceProviderRegisterEntry addr
    ) external onlyAuthorizedChanger {
        coinPairRegisterData._registerCoinPair(coinPair, address(addr));
    }

    /// @notice Set the address for a coinpair (the old one is lost!!!!)
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function setCoinPair(
        bytes32 coinPair,
        IPriceProviderRegisterEntry addr
    ) external onlyAuthorizedChanger {
        coinPairRegisterData._setCoinPair(coinPair, address(addr));
    }

    /// @notice Unregister a coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array.
    function unRegisterCoinPair(bytes32 coinPair, uint256 hint) external onlyAuthorizedChanger {
        coinPairRegisterData._unRegisterCoinPair(coinPair, hint);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256) {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }
}

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract PriceProviderRegisterPairChange is ChangeContract {
    PriceProviderRegister public priceProviderRegister;
    bytes32 public coinPair;
    IPriceProviderRegisterEntry public contractAddr;

    /**
      @notice Constructor
      @param _priceProviderRegister Address of register contract used to register the coin pairs
      @param _coinPair Coinpair to register
      @param _contractAddr Address to register
    */
    constructor(
        PriceProviderRegister _priceProviderRegister,
        bytes32 _coinPair,
        IPriceProviderRegisterEntry _contractAddr
    ) public {
        priceProviderRegister = _priceProviderRegister;
        coinPair = _coinPair;
        contractAddr = _contractAddr;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only redefine
      the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        priceProviderRegister.registerCoinPair(coinPair, contractAddr);
        // OVERRIDE THE OLD ONE !!!
        // priceProviderRegister.setCoinPair(coinPair,contractAddr);
        // TODO: Make it usable just once.
    }
}
