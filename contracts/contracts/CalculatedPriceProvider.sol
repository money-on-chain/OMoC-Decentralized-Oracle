// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "./libs/IPriceProviderRegisterEntry.sol";
import {CalculatedPriceProviderStorage} from "./CalculatedPriceProviderStorage.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
contract CalculatedPriceProvider is
    CalculatedPriceProviderStorage,
    IPriceProvider,
    IPriceProviderRegisterEntry
{
    using SafeMath for uint256;

    /**
    Contract creation.

    @param _governor The address of the contract which governs this one
    @param _wlist Initial whitelist addresses
    @param _multiplicator base value used to scale the result by multiplying it.
    @param _multiplyBy list of IPriceProvider to query the price and then multiply the result
    @param _divisor base value used to scale the result by dividing it.
    @param _divideBy list of IPriceProvider to query the and then divide the result
    */
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        uint256 _multiplicator,
        IPriceProvider[] calldata _multiplyBy,
        uint256 _divisor,
        IPriceProvider[] calldata _divideBy
    ) external initializer {
        _initialize(_governor);
        calculatedPriceProviderData._initialize(_multiplicator, _multiplyBy, _divisor, _divideBy);
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /**
     * @dev Add to the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param _whitelisted - the override coinPair
     * @param _hint Optional hint to start traversing the array, zero is to search all the array.
     */
    function removeFromWhitelist(address _whitelisted, uint256 _hint)
        external
        onlyAuthorizedChanger()
    {
        iterableWhitelistData._removeFromWhitelist(_whitelisted, _hint);
    }

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() external view returns (uint256) {
        return iterableWhitelistData._getWhiteListLen();
    }

    /// @notice Returns the address at index.
    /// @param _idx index to query.
    function getWhiteListAtIndex(uint256 _idx) external view returns (address) {
        return iterableWhitelistData._getWhiteListAtIndex(_idx);
    }

    /// @notice return the type of provider
    function getPriceProviderType() external override pure returns (IPriceProviderType) {
        return IPriceProviderType.Calculated;
    }

    /**
    Get the calculated price

    */
    function peek()
        external
        override
        view
        whitelistedOrExternal(iterableWhitelistData)
        returns (bytes32, bool)
    {
        (uint256 price, bool valid) = calculatedPriceProviderData._peek();
        return (bytes32(price), valid);
    }
}
