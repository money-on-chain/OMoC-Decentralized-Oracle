// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

// prettier-ignore
import {ERC20UpgradeSafe} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

contract TestMOC is Initializable, GovernedAbstract, ERC20UpgradeSafe
{
    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
        __ERC20_init("TESTMOC", "TMOC");
        _setupDecimals(18);
    }

    function mint(address user, uint256 amount) external onlyAuthorizedChanger() {
        _mint(user, amount);
    }
}
