// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract MockDelayMachine is Governed {
    using SafeMath for uint256;
    uint256 public id;
    IERC20 public token;

    function initialize(IGovernor _governor, IERC20 _token) external {
        token = _token;
        Governed._initialize(_governor);
    }

    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @return id the transaction id
    function deposit(
        uint256 mocs,
        address, /*destination*/
        uint256 /*expiration*/
    ) external returns (uint256) {
        require(token.transferFrom(msg.sender, address(this), mocs), "Transfer failed.");
        id = id.add(1);
        return id;
    }
}
