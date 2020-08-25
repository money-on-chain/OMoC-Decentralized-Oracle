// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOraclesLib.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";

contract OracleManagerStorage is Initializable, GovernedAbstract {
    using SafeMath for uint256;
    using OracleInfoLib for OracleInfoLib.OracleRegisterInfo;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using RegisteredOraclesLib for RegisteredOraclesLib.RegisteredOracles;

    // Coin pair register
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Registered oracles
    RegisteredOraclesLib.RegisteredOracles internal registeredOracles;

    // Supporters contract in which we store stake
    SupportersWhitelisted public supportersContract;

    // Minimum coin pair subscription stake
    uint256 public minCPSubscriptionStake;

    // MOC Token contract
    IERC20 public token;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor() internal {}

    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
