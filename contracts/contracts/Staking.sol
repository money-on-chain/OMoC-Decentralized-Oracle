// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IStakingMachine} from "@moc/shared/contracts/IStakingMachine.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {OracleManager} from "./OracleManager.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {StakingStorage} from "./StakingStorage.sol";
import {MockDelayMachine} from "./testing_mocks/MockDelayMachine.sol";

contract Staking is StakingStorage, IStakingMachine {
    using SafeMath for uint256;

    // -----------------------------------------------------------------------
    //
    //   Public interface
    //
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    //   Staking
    // -----------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _supporters the Supporters contract contract address.
    /// @param _oracleManager the Oracle Manager contract contract address.
    /// @param _delayMachine the Delay Machine contract contract address.
    function initialize(
        IGovernor _governor,
        SupportersWhitelisted _supporters,
        OracleManager _oracleManager,
        MockDelayMachine _delayMachine
    ) external {
        Governed._initialize(_governor);
        oracleManager = _oracleManager;
        supporters = _supporters;
        mocToken = _supporters.mocToken();
        delayMachine = _delayMachine;
    }

    /// @notice Used by the voting machine to lock an amount of MOCs.
    /// Delegates to the Supporters smart contract.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param untilTimestamp timestamp until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 untilTimestamp) external override {
        supporters.lockMocs(mocHolder, untilTimestamp);
    }

    /// @notice Accept a deposit from an account.
    /// Delegates to the Supporters smart contract.
    /// @param mocs token quantity
    /// @param destination the destination account of this deposit.
    function deposit(uint256 mocs, address destination) external override {
        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(msg.sender, address(this), mocs), "error in transferFrom");
        // Stake at Supporters contract
        require(mocToken.approve(address(supporters), mocs), "error in approve");
        supporters.stakeAtFrom(mocs, destination, address(this));
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
    ) external override {
        // Transfer stake [should be approved by owner first]
        require(mocToken.transferFrom(source, address(this), mocs), "error in transferFrom");
        // Stake at Supporters contract
        require(mocToken.approve(address(supporters), mocs), "error in approve");
        supporters.stakeAtFrom(mocs, destination, address(this));
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param mocs token quantity
    function withdraw(uint256 mocs) external override {
        uint256 expiration = oracleManager.getWithdrawalExpiration(mocs, msg.sender);
        uint256 tokens = supporters.mocToToken(mocs);
        supporters.withdrawFromTo(tokens, msg.sender, address(this));
        // Approve stake transfer for Delay Machine contract
        require(mocToken.approve(address(delayMachine), mocs), "error in approve");
        delayMachine.deposit(mocs, msg.sender, expiration);

        oracleManager.updateOracleRoundByStake(mocs, msg.sender);
    }

    /// @notice Reports the balance of MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getBalance(address user) external override view returns (uint256) {
        return supporters.getMOCBalanceAt(address(this), user);
    }

    /// @notice Reports the balance of locked MOCs for a specific user.
    /// Delegates to the Supporters smart contract.
    /// @param user user address
    function getLockedBalance(address user) external override view returns (uint256) {
        return supporters.getLockedBalance(user);
    }

    // -----------------------------------------------------------------------
    //   Oracles
    // -----------------------------------------------------------------------

    /// @notice Set an oracle's name (url) and address.
    /// Delegates to the Oracle Manager smart contract.
    /// @param oracleAddr address of the oracle (from which we publish prices)
    /// @param url url used by the oracle server
    function registerOracle(address oracleAddr, string calldata url) external {
        oracleManager.registerOracle(oracleAddr, url);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param oracleAddr Address of the oracle to change
    /// @param url The new url to set.
    function setOracleName(address oracleAddr, string calldata url) external {
        oracleManager.setOracleName(oracleAddr, url);
    }

    /// @notice Return true if the oracle is registered.
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool) {
        return oracleManager.isOracleRegistered(oracleAddr);
    }

    /// @notice Remove an oracle.
    /// Delegates to the Oracle Manager smart contract.
    /// @param oracleAddr address of the oracle
    function removeOracle(address oracleAddr) external {
        oracleManager.removeOracle(oracleAddr);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint256) {
        return oracleManager.getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32) {
        return oracleManager.getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinPair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinPair) external view returns (address) {
        return oracleManager.getContractAddress(coinPair);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256) {
        return oracleManager.getCoinPairIndex(coinPair, hint);
    }

    /// @notice Subscribe an oracle to a coin pair.
    /// Delegates to the Oracle Manager smart contract.
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to subscribe, for example BTCUSD
    function subscribeToCoinPair(address oracleAddr, bytes32 coinPair) external {
        oracleManager.subscribeToCoinPair(oracleAddr, coinPair);
    }

    /// @notice Unsubscribe an oracle from a coin pair.
    /// Delegates to the Oracle Manager smart contract.
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function unsubscribeFromCoinPair(address oracleAddr, bytes32 coinPair) external {
        oracleManager.unsubscribeFromCoinPair(oracleAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    /// @param oracleAddr address of the oracle
    /// @param coinPair coin pair to unsubscribe, for example BTCUSD
    function isSubscribed(address oracleAddr, bytes32 coinPair) external view returns (bool) {
        return oracleManager.isSubscribed(oracleAddr, coinPair);
    }

    /// @notice Returns the list of subscribed coinpair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr)
        external
        view
        returns (CoinPairPrice[] memory addresses, uint256 count)
    {
        return oracleManager.getSubscribedCoinPairAddresses(oracleAddr);
    }
}
