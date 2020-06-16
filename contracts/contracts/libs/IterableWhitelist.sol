pragma solidity 0.6.0;

import "./MoCWhitelist.sol";
/**
  @dev Provides access control between all MoC Contracts
 */
contract IterableWhitelist is MoCWhitelist {
    address[] public keyList;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    /**
     * @dev Add account to whitelist
     */
    function add(address account) internal override {
        if (!super.isWhitelisted(account)) {
            keyList.push(account);
        }
        super.add(account);
    }

    /**
     * @dev Remove account to whitelist
     */
    function remove(address account) internal override {
        super.remove(account);
        for (uint256 i = 0; i < keyList.length; i++) {
            if (keyList[i] == account) {
                keyList[i] = keyList[keyList.length - 1];
                keyList.pop();
                break;
            }
        }
    }

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() public view returns (uint256)
    {
        return keyList.length;
    }

    /// @notice Returns the address at index.
    /// @param i index to query.
    function getWhiteListAtIndex(uint256 i) public view returns (address)
    {
        require(i < keyList.length, "Illegal index");
        return keyList[i];
    }

    // Leave a gap betweeen inherited contracts variables in order to be
    // able to add more variables in them later
    uint256[50] private upgradeGap;
}
