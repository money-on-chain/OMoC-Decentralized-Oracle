// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { MocOperations } from "@moc/moc-main/contracts/core/MocOperations.sol";
import { IPriceProvider } from "@moc/moc-main/contracts/interfaces/IPriceProvider.sol";

library Utils {
    /**
     * @notice Checks if the price is valid.
     * @param priceProvider_ The price provider to check.
     * @return valid True if the price is valid, false otherwise.
     */
    function _isValidPrice(address priceProvider_) internal view returns (bool) {
        (, bool valid) = IPriceProvider(priceProvider_).peek();
        return valid;
    }

    /**
     * @notice Checks if the TP prices are valid.
     * @param mocOperations_ The MocOperations contract to check.
     * @return valid True if all prices are valid, false otherwise.
     */
    function _areValidPrices(address mocOperations_) internal view returns (bool) {
        uint256 tpLength = MocOperations(mocOperations_).getTpAmount();
        for (uint256 i = 0; i < tpLength; i++) {
            (, IPriceProvider priceProvider) = MocOperations(mocOperations_).pegContainer(i);
            if (!Utils._isValidPrice(address(priceProvider))) {
                return false;
            }
        }
        return true;
    }
}
