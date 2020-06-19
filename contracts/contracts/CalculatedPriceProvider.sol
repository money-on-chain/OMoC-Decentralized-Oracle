pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "./IPriceProviderRegisterEntry.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
contract CalculatedPriceProvider is IPriceProvider, IPriceProviderRegisterEntry {
    using SafeMath for uint;
    IPriceProvider[] public multiplyBy;
    IPriceProvider[] public divideBy;
    uint public multiplicator;
    uint public divisor;

    /**
    Contract creation.

    @param _multiplicator base value used to scale the result by multiplying it.
    @param _multiplyBy list of IPriceProvider to query the price and then multiply the result
    @param _divisor base value used to scale the result by dividing it.
    @param _divideBy list of IPriceProvider to query the and then divide the result
    */
    constructor(uint _multiplicator, IPriceProvider[] memory _multiplyBy,
        uint _divisor, IPriceProvider[] memory _divideBy) public {
        multiplicator = _multiplicator;
        multiplyBy = _multiplyBy;
        divisor = _divisor;
        divideBy = _divideBy;
    }

    /// @notice return the type of provider
    function getPriceProviderType() external override view returns (IPriceProviderType) {
        return IPriceProviderType.Calculated;
    }

    /**
    Get the calculated price

    */
    function peek() external override view returns (bytes32, bool) {
        bool valid = true;
        uint den;
        (den, valid) = _multiplyAll(multiplicator, multiplyBy);
        if (!valid) {
            return (bytes32(0), false);
        }
        uint div;
        (div, valid) = _multiplyAll(divisor, divideBy);
        if (!valid || div == 0) {
            return (bytes32(0), false);
        }
        return (bytes32(den.div(div)), true);
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
