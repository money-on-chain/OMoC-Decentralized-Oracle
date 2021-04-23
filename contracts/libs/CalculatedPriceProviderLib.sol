// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IPriceProvider} from "@money-on-chain/omoc-sc-shared/contracts/IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "@money-on-chain/omoc-sc-shared/contracts/IPriceProviderRegisterEntry.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
library CalculatedPriceProviderLib {
    using SafeMath for uint256;
    struct CalculatedPriceProviderData {
        IPriceProvider[] multiplyBy;
        IPriceProvider[] divideBy;
        uint256 multiplicator;
        uint256 divisor;
    }

    uint256 public constant MAX_INT = 2**256 - 1;

    /**
    Contract creation.

    @param _multiplicator base value used to scale the result by multiplying it.
    @param _multiplyBy list of IPriceProvider to query the price and then multiply the result
    @param _divisor base value used to scale the result by dividing it.
    @param _divideBy list of IPriceProvider to query the and then divide the result
    */
    function _initialize(
        CalculatedPriceProviderData storage self,
        uint256 _multiplicator,
        IPriceProvider[] memory _multiplyBy,
        uint256 _divisor,
        IPriceProvider[] memory _divideBy
    ) internal {
        self.multiplicator = _multiplicator;
        self.multiplyBy = _multiplyBy;
        self.divisor = _divisor;
        self.divideBy = _divideBy;
    }

    /**
    Get the calculated price

    */
    function _getPriceInfo(CalculatedPriceProviderData storage self)
        internal
        view
        returns (
            uint256 price,
            bool isValid,
            uint256 lastPubBlock
        )
    {
        uint256 den;
        (den, isValid, lastPubBlock) = _multiplyAll(self.multiplicator, self.multiplyBy);

        (uint256 div, bool valid, uint256 pubBlock) = _multiplyAll(self.divisor, self.divideBy);
        lastPubBlock = min(lastPubBlock, pubBlock);
        if (!isValid || !valid || div == 0) {
            return (0, false, lastPubBlock);
        }
        return (den.div(div), true, lastPubBlock);
    }

    /**
    Multiply a base val by the result of calling peek in the providers contacts

    @param val a base value used to scale things up.this
    @param providers a list of IPriceProvider that are queried for prices, all the prices are multiplied.
    */
    function _multiplyAll(uint256 val, IPriceProvider[] memory providers)
        internal
        view
        returns (
            uint256 price,
            bool isValid,
            uint256 lastPubBlock
        )
    {
        lastPubBlock = MAX_INT;
        isValid = true;
        uint256 current;
        bool valid;
        uint256 pubBlock;
        for (uint256 i = 0; i < providers.length; i++) {
            (current, valid, pubBlock) = providers[i].getPriceInfo();
            if (!valid) {
                isValid = false;
            }
            val = val.mul(uint256(current));
            lastPubBlock = min(lastPubBlock, pubBlock);
        }
        return (val, isValid, lastPubBlock);
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        if (a < b) {
            return a;
        }
        return b;
    }
}
