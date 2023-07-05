// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IStakingMachine, IStakingMachineOracles} from "@moc/shared/contracts/IStakingMachine.sol";
import {IDelayMachine} from "@moc/shared/contracts/IDelayMachine.sol";
import {IOracleManager} from "@moc/shared/contracts/IOracleManager.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {Supporters} from "./Supporters.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {StakingStorage} from "./StakingStorage.sol";

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
    function lockMocs(address mocHolder, uint256 untilTimestamp)
        external
        override
        onlyWhitelisted(iterableWhitelistDataLock)
    {
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
    function _depositFrom(
        uint256 mocs,
        address destination,
        address source
    ) internal {
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
    function getLockingInfo(address user)
        external
        view
        override
        returns (uint256 amount, uint256 untilTimestamp)
    {
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
    function getRegisteredOracleAtIndex(uint256 idx)
        external
        view
        override
        returns (
            address ownerAddr,
            address oracleAddr,
            string memory url
        )
    {
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
    function getCoinPairIndex(bytes32 coinPair, uint256 hint)
        external
        view
        override
        returns (uint256)
    {
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
    function isSubscribed(address ownerAddr, bytes32 coinPair)
        external
        view
        override
        returns (bool)
    {
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
