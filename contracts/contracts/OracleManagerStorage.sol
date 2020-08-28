// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";

contract OracleManagerStorage is Initializable, GovernedAbstract, IIterableWhitelist {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using IterableOraclesLib for IterableOraclesLib.IterableOraclesData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // Whitelisted contracts that can add/remove stake in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    // Coin pair register
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Registered oracles
    IterableOraclesLib.IterableOraclesData internal registeredOracles;

    // Staking contract that manages stake
    Staking public stakingContract;

    // Minimum coin pair subscription stake
    uint256 public minCPSubscriptionStake;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor() internal {}

    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
