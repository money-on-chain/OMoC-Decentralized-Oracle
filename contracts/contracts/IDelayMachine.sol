pragma solidity ^0.6.0;

interface IDelayMachine {
    /// @notice Accept a deposit from an account.
    /// @param mocs token quantity
    /// @param destination the destination address which can control the funds.
    /// @param expiration the expiration date for this deposit
    /// @return id the transaction id
    function deposit(
        uint256 mocs,
        address destination,
        uint256 expiration
    ) external returns (uint256 id);

    /// @notice Cancel a transaction returning the funds to the source
    /// @param id transaction id
    function cancel(uint256 id) external;

    /// @notice Withdraw stake, send it to the delay machine.
    /// @param id transaction id
    function withdraw(uint256 id) external;

    /// @notice Returns the list of transaction for some account
    /// @return ids transaction ids
    /// @return amounts token quantity
    /// @return expirations expiration dates
    /// @return source address to which the funds return if canceled.
    function getTransactions(address account)
        external
        view
        returns (
            uint256[] memory ids,
            uint256[] memory amounts,
            uint256[] memory expirations,
            address[] memory source
        );

    /// @notice Returns the total balance in MOCs for an account
    function getBalance(address account) external view returns (uint256);
}
