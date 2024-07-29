// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IPriceProvider} from "@moc/shared/contracts/IPriceProvider.sol";
import {IPriceProviderRegisterEntry} from "@moc/shared/contracts/IPriceProviderRegisterEntry.sol";
import {CalculatedPriceProviderStorage} from "./CalculatedPriceProviderStorage.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
contract CalculatedPriceProvider is
    CalculatedPriceProviderStorage,
    IPriceProvider,
    IPriceProviderRegisterEntry
{
    using SafeMath for uint256;

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

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
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
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
    function getPriceProviderType() external pure override returns (IPriceProviderType) {
        return IPriceProviderType.Calculated;
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek()
        external
        view
        override
        whitelistedOrExternal(iterableWhitelistData)
        returns (bytes32, bool)
    {
        (uint256 price, bool valid, ) = calculatedPriceProviderData._getPriceInfo();
        return (bytes32(price), valid);
    }

    // Return the current price.
    function getPrice() external view override returns (uint256) {
        (uint256 price, , ) = calculatedPriceProviderData._getPriceInfo();
        return uint256(price);
    }

    // Return if the price is not expired.
    function getIsValid() external view override returns (bool) {
        (, bool valid, ) = calculatedPriceProviderData._getPriceInfo();
        return valid;
    }

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external view override returns (uint256) {
        (, , uint256 lastPubBlock) = calculatedPriceProviderData._getPriceInfo();
        return lastPubBlock;
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        view
        override
        returns (uint256 price, bool isValid, uint256 lastPubBlock)
    {
        return calculatedPriceProviderData._getPriceInfo();
    }
}
