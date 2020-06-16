pragma solidity 0.6.0;
/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCWhitelist {

    mapping(address => bool) whitelist;
    /**
     * @dev Check if an account is whitelisted
     * @return Bool
     */
    function isWhitelisted(address account)
    public
    view
    returns (bool)
    {
        require(account != address(0), "Account must not be 0x0");
        return whitelist[account];
    }

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier onlyWhitelisted(address account) {
        require(isWhitelisted(account), "Address is not whitelisted");
        _;
    }

    /**
     * @dev Add account to whitelist
     */
    function add(address account) internal virtual {
        require(account != address(0), "Account must not be 0x0");
        require(!isWhitelisted(account), "Account not allowed to add accounts into white list");
        whitelist[account] = true;
    }
    /**
     * @dev Remove account to whitelist
     */
    function remove(address account) internal virtual {
        require(account != address(0), "Account must not be 0x0");
        require(isWhitelisted(account), "Account is not allowed to remove address from the white list");
        whitelist[account] = false;
    }
    // Leave a gap betweeen inherited contracts variables in order to be
    // able to add more variables in them later
    uint256[50] private upgradeGap;
}
