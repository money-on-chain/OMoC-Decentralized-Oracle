pragma solidity 0.6.0;

import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {CalculatedPriceProviderLib} from "./libs/CalculatedPriceProviderLib.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
contract CalculatedPriceProviderStorage is Initializable, GovernedAbstract, IIterableWhitelist {
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    CalculatedPriceProviderLib.CalculatedPriceProviderData internal calculatedPriceProviderData;
    using CalculatedPriceProviderLib for CalculatedPriceProviderLib.CalculatedPriceProviderData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
