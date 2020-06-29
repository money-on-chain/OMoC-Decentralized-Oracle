pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {SupportersVestedLib} from "./libs/SupportersVestedLib.sol";
import {SupportersLib} from "./libs/SupportersLib.sol";

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersWhitelistedStorage is Initializable, GovernedAbstract, IIterableWhitelist {
    using SafeMath for uint;
    using SupportersLib for SupportersLib.SupportersData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;
    using SupportersVestedLib for SupportersVestedLib.SupportersVestedData;

    // Whitelisted contracts that can add/remove stake in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    // This contract has vesting restrictions: must stop and then remove.
    SupportersVestedLib.SupportersVestedData internal supportersVestedData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
