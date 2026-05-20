// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IPriceProvider } from "@moc/moc-main/contracts/interfaces/IPriceProvider.sol";

contract BasefeeProvider is IPriceProvider {
    function peek() external view returns (bytes32 price, bool valid) {
        return (bytes32(uint256(block.basefee)), true);
    }

    function getLastPublicationBlock() external view returns (uint256 lastPublicationBlock) {
        return block.number;
    }
}
