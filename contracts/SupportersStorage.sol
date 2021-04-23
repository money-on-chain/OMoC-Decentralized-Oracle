// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {SupportersLib} from "./libs/SupportersLib.sol";

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using SupportersLib for SupportersLib.SupportersData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    struct LockingInfo {
        uint256 untilTimestamp;
        uint256 amount;
    }

    mapping(address => LockingInfo) public lockedMocs;

    // Whitelisted contracts that can add/remove stake in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    SupportersLib.SupportersData internal supportersData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
