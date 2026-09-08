// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

contract MockLendingManagerForTask {
    bool public liquidationAvailable;
    uint256 public liquidationCount;
    address public lastUser;
    address public lastTpToken;
    address public lastMocBucket;

    function setLiquidationAvailable(bool available_) external {
        liquidationAvailable = available_;
    }

    function isLiquidationAvailable(address, address, address) external view returns (bool) {
        return liquidationAvailable;
    }

    function liquidate(address user_, address tpToken_, address mocBucket_) external {
        require(liquidationAvailable, 'Liquidation unavailable');
        liquidationCount++;
        lastUser = user_;
        lastTpToken = tpToken_;
        lastMocBucket = mocBucket_;
    }
}
