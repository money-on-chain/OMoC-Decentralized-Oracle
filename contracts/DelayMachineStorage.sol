// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
// prettier-ignore
import {EnumerableSet} from "@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IStakingMachine} from "@moc/shared/contracts/IStakingMachine.sol";

contract DelayMachineStorage is Initializable, Governed {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;

    struct Payment {
        uint256 expiration;
        uint256 amount;
    }

    struct Owner {
        EnumerableSet.UintSet ids;
    }

    uint256 public _id;
    IERC20 public _token;
    address public _source;
    mapping(address => Owner) internal owners;
    mapping(uint256 => Payment) internal payments;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
