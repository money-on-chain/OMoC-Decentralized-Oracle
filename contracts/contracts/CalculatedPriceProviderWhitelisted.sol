pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {IterableWhitelist} from "./libs/IterableWhitelist.sol";
import {IPriceProviderRegisterEntry} from "./IPriceProviderRegisterEntry.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";
import {CalculatedPriceProvider} from "./CalculatedPriceProvider.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";

/// @title This contract gets the price from some IPriceProviders and do the math to calculate
/// a deduced price, for example RIFBTC and BTCUSD gives the price of RIFUSD
contract CalculatedPriceProviderWhitelisted is Initializable, Governed, CalculatedPriceProvider,
IterableWhitelist, IPriceProvider, IPriceProviderRegisterEntry {

    using SafeMath for uint;

    /**
    Contract creation.

    @param _governor The address of the contract which governs this one
    @param _wlist Initial whitelist addresses
    @param _multiplicator base value used to scale the result by multiplying it.
    @param _multiplyBy list of IPriceProvider to query the price and then multiply the result
    @param _divisor base value used to scale the result by dividing it.
    @param _divideBy list of IPriceProvider to query the and then divide the result
    */
    function initialize(IGovernor _governor, address[] memory _wlist,
        uint _multiplicator, IPriceProvider[] memory _multiplyBy,
        uint _divisor, IPriceProvider[] memory _divideBy) public initializer {
        Governed.initialize(_governor);
        CalculatedPriceProvider._initialize(_multiplicator, _multiplyBy, _divisor, _divideBy);
        for (uint256 i = 0; i < _wlist.length; i++) {
            IterableWhitelist.add(_wlist[i]);
        }
    }


    /**
     * @dev Add to the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        IterableWhitelist.add(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        IterableWhitelist.remove(_whitelisted);
    }


    /**
     * @dev Set the value of multiplyBy
     * @param  _multiplyBy - array of contracts to be multiplied by
     */
    function setMultiplyBy(IPriceProvider[] calldata _multiplyBy) external onlyAuthorizedChanger() {
        multiplyBy = _multiplyBy;
    }


    /**
     * @dev Set the value of divideBy
     * @param  _divideBy - array of contracts to be divided by
     */
    function setDivideBy(IPriceProvider[] calldata _divideBy) external onlyAuthorizedChanger() {
        divideBy = _divideBy;
    }


    /**
     * @dev Set the value of the base multiplicator
     * @param  _multiplicator - uint to use to start the multiplication chain
     */
    function setMultiplicator(uint _multiplicator) external onlyAuthorizedChanger() {
        multiplicator = _multiplicator;
    }

    /**
     * @dev Set the value of the base divisor
     * @param _divisor - uint to use to start the division chain
     */
    function setDivisor(uint _divisor) external onlyAuthorizedChanger() {
        divisor = _divisor;
    }


    /// @notice return the type of provider
    function getPriceProviderType() external override view returns (IPriceProviderType) {
        return IPriceProviderType.Calculated;
    }

    /**
    Get the calculated price

    */
    function peek() external override view whitelistedOrExternal(msg.sender) returns (bytes32, bool) {
        (uint256 price, bool valid) = CalculatedPriceProvider._peek();
        return (bytes32(price), valid);
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
