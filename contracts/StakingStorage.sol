// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IDelayMachine} from "@money-on-chain/omoc-sc-shared/contracts/IDelayMachine.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {Supporters} from "./Supporters.sol";
import {IOracleManager} from "@money-on-chain/omoc-sc-shared/contracts/IOracleManager.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";

contract StakingStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    Supporters internal supporters;
    IOracleManager internal oracleManager;
    IERC20 internal mocToken;
    IDelayMachine internal delayMachine;

    // A fixed amount of lock time that is added to withdraws.
    uint256 internal withdrawLockTime;

    // Whitelisted contracts that can lock stake.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistDataLock;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
