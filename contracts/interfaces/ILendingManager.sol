// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

interface ILendingManager {
    function liquidate(address user_, address tpToken_, address mocBucket_) external;
}
