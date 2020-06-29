pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {IPriceProviderRegisterEntry} from "./libs/IPriceProviderRegisterEntry.sol";

/// @title A registry for the coin pair prices, this is more general than OracleManager that stores
/// only the coin pairs that are published by oracles.
contract PriceProviderRegisterStorage is Initializable, GovernedAbstract {
    using SafeMath for uint;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;

    // Coin Pair register, has the same entries as OracleManage + calculated prices.
    CoinPairRegisterLib.CoinPairRegisterData coinPairRegisterData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
