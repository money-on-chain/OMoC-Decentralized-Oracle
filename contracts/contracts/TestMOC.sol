pragma solidity 0.6.0;

import {ERC20} from "./openzeppelin/token/ERC20/ERC20.sol";
import {GovernedAbstract} from "./GovernedAbstract.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";

contract TestMOC is ERC20, Initializable, GovernedAbstract
{
    string public name = "TESTMOC";
    string public symbol = "TMOC";
    uint8 public constant decimals = 18;

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    function mint(address user, uint256 amount) external onlyAuthorizedChanger() {
        _mint(user, amount);
    }
}
