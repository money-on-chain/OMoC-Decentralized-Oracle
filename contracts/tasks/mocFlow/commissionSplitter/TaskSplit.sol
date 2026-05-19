// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { ITask } from "../../../ITask.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TaskSplit is ITask {
    address private constant COINBASE = address(0);

    error TaskNotAvailable();

    ICommissionSplitter public immutable commissionSplitter;
    uint256 public immutable points;
    address token;
    address feeToken;
    uint256 public immutable tokenBalanceThreshold;
    uint256 public immutable feeTokenBalanceThreshold;

    /**
     * @notice Constructor
     * @param commissionSplitter_ The address of the commission splitter contract.
     * @param points_ The points awarded for running this task.
     * @param token_ The address of the token to split. Use address(0) for coinbase.
     * @param feeToken_ The address of the fee token to split, can be zero if not applicable.
     * @param tokenBalanceThreshold_ The minimum balance of the token required to perform the split.
     * @param feeTokenBalanceThreshold_ The minimum balance of the fee token required to perform the split.
     */
    constructor(
        address commissionSplitter_,
        uint256 points_,
        address token_,
        address feeToken_,
        uint256 tokenBalanceThreshold_,
        uint256 feeTokenBalanceThreshold_
    ) {
        commissionSplitter = ICommissionSplitter(commissionSplitter_);
        points = points_;
        token = token_;
        feeToken = feeToken_;
        tokenBalanceThreshold = tokenBalanceThreshold_;
        feeTokenBalanceThreshold = feeTokenBalanceThreshold_;
    }

    /**
     * @inheritdoc ITask
     */
    function checkTask() external view returns (bool) {
        return _splitAvailable(commissionSplitter);
    }

    /**
     * @inheritdoc ITask
     */
    function runTask() external returns (uint256) {
        commissionSplitter.split();
        return points;
    }

    /**
     * @notice Check if the commission splitter has enough balance to split.
     * @param commissionSplitter_ The commission splitter contract.
     * @return bool True if the commission splitter can split, false otherwise.
     */
    function _splitAvailable(ICommissionSplitter commissionSplitter_) internal view returns (bool) {
        uint256 tokenBalance = balanceOf(address(commissionSplitter_));
        // CommissionSplitter may not have a feeToken, in that case we only check the token balance
        uint256 feeTokenBalance = feeToken == address(0) ? 0 : IERC20(feeToken).balanceOf(address(commissionSplitter_));
        return tokenBalance >= tokenBalanceThreshold || feeTokenBalance >= feeTokenBalanceThreshold;
    }

    /**
     * @notice get the balance of the contract
     * @param account_ address to check the balance
     * @return balance of the contract
     */
    function balanceOf(address account_) internal view returns (uint256) {
        if (token == COINBASE) {
            return account_.balance;
        } else {
            return IERC20(token).balanceOf(account_);
        }
    }
}

interface ICommissionSplitter {
    function split() external;
    function tokenGovern() external view returns (IERC20);
}
