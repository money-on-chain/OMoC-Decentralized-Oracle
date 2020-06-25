pragma solidity 0.6.0;

import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOraclesLib.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";

contract OracleManagerStorage is Initializable, GovernedAbstract {
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;

    RegisteredOraclesLib.RegisteredOracles  internal registeredOracles;
    using RegisteredOraclesLib for RegisteredOraclesLib.RegisteredOracles;

    SupportersWhitelisted public            supportersContract;
    uint256 public                          minOracleOwnerStake;
    IERC20 public                           token;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
