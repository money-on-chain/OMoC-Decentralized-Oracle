pragma solidity ^0.6.0;
import "./openzeppelin/token/ERC20/ERC20.sol";

contract TestMOC is ERC20
{
    string public name = "TESTMOC";
    string public symbol = "TMOC";
    uint8 public constant decimals = 18;

    function mint(address user, uint256 amount) public {
        _mint(user, amount);
    }
}
