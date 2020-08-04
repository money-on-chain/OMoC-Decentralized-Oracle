pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {Initializable} from  "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {OracleManager} from "./OracleManager.sol";


contract StakingStorage is Initializable, GovernedAbstract {
    using SafeMath for uint;

    SupportersWhitelisted public supportersContract;
    OracleManager public oracleManager;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
