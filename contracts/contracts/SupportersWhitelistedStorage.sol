pragma solidity 0.6.0;

import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {SupportersVestedLib} from "./libs/SupportersVestedLib.sol";

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersWhitelistedStorage is Initializable, GovernedAbstract, IIterableWhitelist {
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    SupportersVestedLib.SupportersVestedData internal supportersVestedData;
    using SupportersVestedLib for SupportersVestedLib.SupportersVestedData;

    // Emitted by SupportersLib and SupportersVestedLib
    event PayEarnings(uint256 earnings, uint256 start, uint256 end);
    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);
    event AddStake(address indexed user, address indexed subaccount,
        address indexed sender, uint256 amount, uint256 mocs);
    event WithdrawStake(address indexed user, address indexed subaccount,
        address indexed destination, uint256 amount, uint256 mocs);

    event Stop(address indexed msg_sender, address indexed user, uint256 blockNum);
    event Withdraw(address indexed msg_sender, address indexed subacount,
        address indexed receiver, uint256 mocs, uint256 blockNum);


    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
