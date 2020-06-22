pragma solidity 0.6.0;

import {MoCWhitelist} from "./MoCWhitelist.sol";
/**
  @dev Provides access control between all MoC Contracts
 */
contract IterableWhitelist is MoCWhitelist {
    // We use address(1) to allow calls from outside the block chain to peek
    // The call must use msg.sender == 1 (or { from: 1 }) something that only can be done from outside the blockchain.
    address constant ADDRESS_ONE = address(1);

    address[] internal keyList;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be filtered by the whitelist
     */
    modifier whitelistedOrExternal(address account) {
        require(msg.sender == ADDRESS_ONE || isWhitelisted(msg.sender), "Address is not whitelisted");
        _;
    }


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
