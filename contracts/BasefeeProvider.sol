// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

contract BasefeeProvider {
    function getPrice() external view returns (uint256) {
        return block.basefee;
    }

    function peek() external view returns (bytes32, bool) {
        return (bytes32(block.basefee), true);
    }
}
