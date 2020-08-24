// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IPriceProvider} from "./IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "./IPriceProviderRegisterEntry.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
library CalculatedPriceProviderLib {
    using SafeMath for uint;
    struct CalculatedPriceProviderData {
        IPriceProvider[] multiplyBy;
        IPriceProvider[] divideBy;
        uint multiplicator;
        uint divisor;
    }

    /**
    Contract creation.

    @param _multiplicator base value used to scale the result by multiplying it.
    @param _multiplyBy list of IPriceProvider to query the price and then multiply the result
    @param _divisor base value used to scale the result by dividing it.
    @param _divideBy list of IPriceProvider to query the and then divide the result
    */
    function _initialize(CalculatedPriceProviderData storage self, uint _multiplicator,
        IPriceProvider[] memory _multiplyBy, uint _divisor, IPriceProvider[] memory _divideBy)
    internal {
        self.multiplicator = _multiplicator;
        self.multiplyBy = _multiplyBy;
        self.divisor = _divisor;
        self.divideBy = _divideBy;
    }


    /**
    Get the calculated price

    */
    function _peek(CalculatedPriceProviderData storage self) internal view returns (uint256, bool) {
        bool valid = true;
        uint den;
        (den, valid) = _multiplyAll(self.multiplicator, self.multiplyBy);
        if (!valid) {
            return (0, false);
        }
        uint div;
        (div, valid) = _multiplyAll(self.divisor, self.divideBy);
        if (!valid || div == 0) {
            return (0, false);
        }
        return (den.div(div), true);
    }

    /**
    Multiply a base val by the result of calling peek in the providers contacts

    @param val a base value used to scale things up.this
    @param providers a list of IPriceProvider that are queried for prices, all the prices are multiplied.
    */
    function _multiplyAll(uint val, IPriceProvider[] memory providers) internal view returns (uint, bool) {
        bytes32 current32;
        bool valid;
        for (uint256 i = 0; i < providers.length; i++) {
            (current32, valid) = providers[i].peek();
            if (!valid) {
                return (0, false);
            }
            val = val.mul(uint(current32));
        }
        return (val, true);
    }
}
