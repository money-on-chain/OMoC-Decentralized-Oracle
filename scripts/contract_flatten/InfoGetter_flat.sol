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
pragma experimental ABIEncoderV2;

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

interface IOracleInfoGetter {
    struct FullOracleRoundInfo {
        uint256 stake;
        uint256 points;
        address addr;
        address owner;
        string name;
    }

    struct OracleServerInfo {
        uint256 round;
        uint256 startBlock;
        uint256 lockPeriodTimestamp;
        uint256 totalPoints;
        FullOracleRoundInfo[] info;
        uint256 price;
        uint256 currentBlock;
        uint256 lastPubBlock;
        bytes32 lastPubBlockHash;
        uint256 validPricePeriodInBlocks;
    }

    struct ManagerUIOracleInfo {
        uint256 stake;
        uint256 mocsBalance;
        uint256 basecoinBalance;
        address addr;
        address owner;
        string name;
    }

    struct ManagerUICoinPairInfo {
        address addr;
        bytes32 coinPair;
    }

    struct CoinPairUIOracleRoundInfo {
        uint256 points;
        bool selectedInRound;
        address addr;
    }

    struct CoinPairPriceUIInfo {
        uint256 round;
        uint256 startBlock;
        uint256 lockPeriodTimestamp;
        uint256 totalPoints;
        CoinPairUIOracleRoundInfo[] info;
        uint256 currentBlock;
        uint256 lastPubBlock;
        bytes32 lastPubBlockHash;
        uint256 validPricePeriodInBlocks;
        uint256 availableRewards;
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _coinPairPrice coinPairPrice contract
    */
    function getCoinPairUIInfo(
        ICoinPairPrice _coinPairPrice
    ) external view returns (CoinPairPriceUIInfo memory coinPairPriceUIInfo);

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _offset take from this offset
        @param _limit take to this limit, limit == 0 => take all
    */
    function getManagerUICoinPairInfo(
        IOracleManager _oracleManager,
        uint256 _offset,
        uint256 _limit
    ) external view returns (ManagerUICoinPairInfo[] memory info);

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _from The index to start from.
        @param _cant Number of items to return.
    */
    function getManagerUIOracleInfo(
        IOracleManager _oracleManager,
        uint256 _from,
        uint256 _cant
    ) external view returns (ManagerUIOracleInfo[] memory info, address nextEntry);

    /**
        Return all the information needed by the oracle server (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
    */
    function getOracleServerInfo(
        IOracleManager _oracleManager,
        ICoinPairPrice _coinPairPrice
    ) external view returns (OracleServerInfo memory oracleServerInfo);
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

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract InfoGetter is Initializable, Governed, IOracleInfoGetter {
    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _coinPairPrice coinPairPrice contract
    */
    function getCoinPairUIInfo(
        ICoinPairPrice _coinPairPrice
    ) external view override returns (CoinPairPriceUIInfo memory coinPairPriceUIInfo) {
        (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            ,
            address[] memory selectedOracles
        ) = _coinPairPrice.getRoundInfo();
        uint256 len = selectedOracles.length;
        CoinPairUIOracleRoundInfo[] memory info = new CoinPairUIOracleRoundInfo[](len);
        for (uint256 i = 0; i < len; i++) {
            address addr = selectedOracles[i];
            (uint256 points, bool selectedInRound) = _coinPairPrice.getOracleRoundInfo(addr);
            info[i] = CoinPairUIOracleRoundInfo(points, selectedInRound, addr);
        }
        uint256 lastPublicationBlock = _coinPairPrice.getLastPublicationBlock();
        return
            CoinPairPriceUIInfo(
                round,
                startBlock,
                lockPeriodTimestamp,
                totalPoints,
                info,
                block.number,
                lastPublicationBlock,
                blockhash(lastPublicationBlock),
                _coinPairPrice.getValidPricePeriodInBlocks(),
                _coinPairPrice.getAvailableRewardFees()
            );
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _offset take from this offset
        @param _limit take to this limit, limit == 0 => take all
    */
    function getManagerUICoinPairInfo(
        IOracleManager _oracleManager,
        uint256 _offset,
        uint256 _limit
    ) external view override returns (ManagerUICoinPairInfo[] memory info) {
        uint256 total = _oracleManager.getCoinPairCount();
        if (_limit > total || _limit == 0) {
            _limit = total;
        }
        if (_offset > _limit) {
            _offset = _limit;
        }
        uint256 cant = (_limit - _offset);
        info = new ManagerUICoinPairInfo[](cant);
        for (uint256 i = 0; i < cant; i++) {
            bytes32 cp = _oracleManager.getCoinPairAtIndex(i + _offset);
            info[i] = ManagerUICoinPairInfo(_oracleManager.getContractAddress(cp), cp);
        }
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _from The index to start from.
        @param _cant Number of items to return.
    */
    function getManagerUIOracleInfo(
        IOracleManager _oracleManager,
        uint256 _from,
        uint256 _cant
    ) external view override returns (ManagerUIOracleInfo[] memory info, address nextEntry) {
        uint256 len = _oracleManager.getRegisteredOraclesLen();
        if (_from >= len) {
            return (info, nextEntry);
        }
        if (_cant > (len - _from)) {
            _cant = len - _from;
        }
        info = new ManagerUIOracleInfo[](_cant);
        for (uint256 i = 0; i < _cant; i++) {
            (address ownerAddr, address oracleAddr, string memory url) = _oracleManager
                .getRegisteredOracleAtIndex(i + _from);
            uint256 stake = _oracleManager.getStake(ownerAddr);
            info[i] = ManagerUIOracleInfo({
                stake: stake,
                mocsBalance: _oracleManager.getStakingContract().getMocToken().balanceOf(
                    oracleAddr
                ),
                basecoinBalance: oracleAddr.balance,
                addr: oracleAddr,
                owner: ownerAddr,
                name: url
            });
        }
        return (info, nextEntry);
    }

    /**
        Return all the information needed by the oracle server (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
    */
    function getOracleServerInfo(
        IOracleManager _oracleManager,
        ICoinPairPrice _coinPairPrice
    ) external view override returns (OracleServerInfo memory oracleServerInfo) {
        uint256 lastPubBlock = _coinPairPrice.getLastPublicationBlock();
        (bytes32 currentPrice, ) = _coinPairPrice.peek();

        (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            ,
            address[] memory selectedOracles
        ) = _coinPairPrice.getRoundInfo();

        return
            OracleServerInfo(
                round,
                startBlock,
                lockPeriodTimestamp,
                totalPoints,
                _createFullRoundInfo(_oracleManager, _coinPairPrice, selectedOracles),
                uint256(currentPrice),
                block.number,
                lastPubBlock,
                blockhash(lastPubBlock),
                _coinPairPrice.getValidPricePeriodInBlocks()
            );
    }

    /**
        Create the FullOracleRoundInfo array from slected oracles
        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
        @param _selectedOracles selected oracles addresses
    */
    function _createFullRoundInfo(
        IOracleManager _oracleManager,
        ICoinPairPrice _coinPairPrice,
        address[] memory _selectedOracles
    ) private view returns (FullOracleRoundInfo[] memory info) {
        uint256 len = _selectedOracles.length;
        info = new FullOracleRoundInfo[](len);
        for (uint256 i = 0; i < len; i++) {
            address owner = _oracleManager.getOracleOwner(_selectedOracles[i]);
            (string memory name, uint256 stake, ) = _oracleManager.getOracleRegistrationInfo(owner);
            (uint256 points, ) = _coinPairPrice.getOracleRoundInfo(_selectedOracles[i]);
            info[i] = FullOracleRoundInfo(stake, points, _selectedOracles[i], owner, name);
        }
        return info;
    }
}
