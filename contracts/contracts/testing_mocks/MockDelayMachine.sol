pragma solidity ^0.6.0;

import {SafeMath} from "../openzeppelin/math/SafeMath.sol";
import {Governed} from "../moc-gobernanza/Governance/Governed.sol";
import {IGovernor} from "../moc-gobernanza/Governance/IGovernor.sol";
import {IERC20} from "../openzeppelin/token/ERC20/IERC20.sol";

contract MockDelayMachine is Governed {
    using SafeMath for uint;
    uint256 id;
    IERC20 token;

    function initialize(IGovernor _governor, IERC20 _token) external {
        token = _token;
        Governed._initialize(_governor);
    }

    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @return id the transaction id
    function deposit(
        uint256 mocs,
        address /*destination*/,
        uint256 /*expiration*/
    ) external returns (uint256) {
        require(token.transferFrom(msg.sender, address(this), mocs), "Transfer failed.");
        id = id.add(1);
        return id;
    }
}
