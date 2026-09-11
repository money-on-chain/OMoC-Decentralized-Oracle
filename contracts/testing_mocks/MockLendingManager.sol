// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ILendingManager} from '../interfaces/ILendingManager.sol';

contract MockLendingManager is ILendingManager {
    mapping(address => bool) public shouldLiquidate;
    uint256 public liquidationCount;
    address public lastUser;
    address public lastTpToken;
    address public lastMocBucket;

    function setShouldLiquidate(address _user, bool _shouldLiquidate) external {
        shouldLiquidate[_user] = _shouldLiquidate;
    }

    function liquidate(address _user, address _tpToken, address _mocBucket) external override {
        require(shouldLiquidate[_user], 'Liquidation unavailable');
        liquidationCount++;
        lastUser = _user;
        lastTpToken = _tpToken;
        lastMocBucket = _mocBucket;
    }
}
