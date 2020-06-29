pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
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
    using SafeMath for uint;
    using OracleInfoLib for OracleInfoLib.OracleRegisterInfo;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using RegisteredOraclesLib for RegisteredOraclesLib.RegisteredOracles;

    // Coin pair register
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Registered oracles
    RegisteredOraclesLib.RegisteredOracles  internal registeredOracles;

    // Supporters contract in which we store stake
    SupportersWhitelisted public            supportersContract;

    // Minimum owner stake
    uint256 public                          minOracleOwnerStake;

    // MOC Token contract
    IERC20 public                           token;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
