pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {OracleManager} from "./OracleManager.sol";

contract Staking {
    using SafeMath for uint;
    mapping(uint256 => uint256) blockedMocs;

    // -----------------------------------------------------------------------
    //
    //   Public interface
    //
    // -----------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _supportersContract the Supporters contract contract address.
    function initialize(SupportersWhitelisted _supportersContract, OracleManager _oracleManager) external {
        supportersContract = _supportersContract;
        oracleManager = _oracleManager;
    }

    /// @notice Used by the voting machine to lock an amount of MOCs.
    /// Delegate to the Supporters smart contract.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param amount amount of mocs to be locked.
    /// @param endBlock block until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 amount, uint256 endBlock) external {
        supportersContract.lockMocs(mocHolder, amount, endBlock);
    }

    /// @notice Accept a deposit from an account.
    /// Delegate to the Supporters smart contract.
    function addStake(uint256 mocs, address subaccount, address sender) external {
        supportersContract.stakeAtFrom(mocs, subaccount, sender);
    }

    /// @notice Remove stake from an oracle.
    function withdraw(uint256 tokens, address subaccount, address receiver) external {
        supportersContract.withdrawFromTo(tokens, subaccount, receiver);
    }

    /// @notice Set an oracle's name (url) and address.
    function registerOracle(address oracleAddr, string calldata internetName, uint stake) external {
        oracleManager.registerOracle(oracleAddr, internetName, stake);
    }

    /// @notice Subscribe an oracle to a coin pair.
    /// Delegated to the Oracle Manager smart contract.
    function subscribeToCoinPair(address oracleAddr, bytes32 coinPair) external {
        oracleManager.subscribeToCoinPair(oracleAddr, coinPair);
    }

    /// @notice Unsubscribe an oracle from a coin pair.
    /// Delegated to the Oracle Manager smart contract.
    function unSubscribeFromCoinPair(address oracleAddr, bytes32 coinPair) external {
        oracleManager.registerOracle(oracleAddr, coinPair);
    }

    /// @notice Remove an oracle.
    function removeOracle(address oracleAddr) external {
        oracleManager.removeOracle(oracleAddr);
    }

    /// @notice Reports the total amount of MOCs in staking state.
    /// Delegate to the Supporters smart contract.
    function getTotalLockedMocs() external {
        return supportersContract.getTotalLockedMocs();
    }

    /// @notice Reports the balance of MOCs for a specific user.
    /// Delegate to the Supporters smart contract.
    function getUserMocsBalance(address user) external {
        return supportersContract.getUserMocsBalance(user);
    }
}