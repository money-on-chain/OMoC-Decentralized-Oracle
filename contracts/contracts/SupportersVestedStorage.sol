pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {Initializable} from  "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {SupportersVestedLib} from "./libs/SupportersVestedLib.sol";

/*
    Implementation of SupportersVestedAbstract used by regular supporters.
    This can be merged into SupportersWhitelisted directly, but we choose separate it so
    we can add other contracts with different kind of restrictions to the supporters smart-contract.
*/
contract SupportersVestedStorage is Initializable, GovernedAbstract {
    using SafeMath for uint;

    SupportersWhitelisted public            supporters;
    IERC20 public                           mocToken;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
