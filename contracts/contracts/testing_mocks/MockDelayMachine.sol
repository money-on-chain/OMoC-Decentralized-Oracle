pragma solidity ^0.6.0;

import {IDelayMachine} from "../IDelayMachine.sol";
import {Governed} from "../moc-gobernanza/Governance/Governed.sol";
import {IGovernor} from "../moc-gobernanza/Governance/IGovernor.sol";

contract MockDelayMachine is IDelayMachine, Governed {

    function initialize(IGovernor _governor) external {
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
    ) external override returns (uint256 id) {
        return 1;
    }

    /// @notice Cancel a transaction returning the funds to the source
    /// @param id transaction id
    function cancel(uint256 id) external override {
        return;
    }

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param id transaction id
    function withdraw(uint256 id) external override {
        return;
    }

    /// @notice Returns the list of transaction for some account
    /// @return ids transaction ids
    /// @return amounts token quantity
    /// @return expirations expiration dates
    /// @return sources address to which the funds return if canceled.
    function getTransactions(address account) external override view
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
    function getBalance(address account) external override view returns (uint256) {
        return 1;
    }
}
