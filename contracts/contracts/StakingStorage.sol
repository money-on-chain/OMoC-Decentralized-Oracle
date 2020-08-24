// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {OracleManager} from "./OracleManager.sol";
import {MockDelayMachine} from "./testing_mocks/MockDelayMachine.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";


contract StakingStorage is Initializable, GovernedAbstract {

    SupportersWhitelisted public supporters;
    OracleManager public oracleManager;
    IERC20 public mocToken;
    MockDelayMachine public delayMachine;

    uint256 thirtyDays = 60 * 60 * 24 * 30;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
