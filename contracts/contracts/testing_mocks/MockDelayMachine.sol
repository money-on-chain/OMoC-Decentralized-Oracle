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
    /// @param destination the destination address which can control the funds.
    /// @param expiration the expiration date for this deposit
    /// @return id the transaction id
    function deposit(
        uint256 mocs,
        address destination,
        uint256 expiration
    ) external returns (uint256) {
        require(token.transferFrom(msg.sender, address(this), mocs), "Transfer failed.");
        id = id.add(1);
        return id;
    }

    /// @notice Cancel a transaction returning the funds to the source
    /// @param _id transaction id
    function cancel(uint256 _id) external {
        return;
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param _id transaction id
    function withdraw(uint256 _id) external {
        return;
    }

    /// @notice Returns the list of transaction for some account
    /// @return ids transaction ids
    /// @return amounts token quantity
    /// @return expirations expiration dates
    /// @return sources address to which the funds return if canceled.
    function getTransactions(address account) external view
    returns (
        uint256[] memory ids,
        uint256[] memory amounts,
        uint256[] memory expirations,
        address[] memory sources
        ) {
            uint256 len = 10;
            ids = new uint256[](len);
            amounts = new uint256[](len);
            expirations = new uint256[](len);
            sources = new address[](len);
    }

    /// @notice Returns the total balance in MOCs for an account
    function getBalance(address account) external view returns (uint256) {
        return 1;
    }
}
