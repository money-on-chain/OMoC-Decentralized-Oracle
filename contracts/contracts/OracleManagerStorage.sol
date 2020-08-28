// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";

contract OracleManagerStorage is Initializable, GovernedAbstract {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using IterableOraclesLib for IterableOraclesLib.IterableOraclesData;

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

    /**
     @notice Modifier that protects the function
     @dev You should use this modifier in any function that should be called only by Staking contract
    */
    modifier onlyStaking() {
        require(msg.sender == address(stakingContract), "Must be called from Staking Contract");
        _;
    }
}
