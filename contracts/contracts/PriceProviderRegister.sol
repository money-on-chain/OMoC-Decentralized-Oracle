pragma solidity 0.6.0;

import {GovernedAbstract} from "./GovernedAbstract.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";
import {CoinPairRegister} from "./CoinPairRegister.sol";
import {IPriceProviderRegisterEntry} from "./IPriceProviderRegisterEntry.sol";

/// @title A registry for the coin pair prices, this is more general than OracleManager that stores
/// only the coin pairs that are published by oracles.
contract PriceProviderRegister is Initializable, GovernedAbstract, CoinPairRegister {

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(bytes32 coinPair, IPriceProviderRegisterEntry addr) public onlyAuthorizedChanger() {
        _registerCoinPair(coinPair, address(addr));
    }

    /// @notice Set the address for a coinpair (the old one is lost!!!!)
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function setCoinPair(bytes32 coinPair, IPriceProviderRegisterEntry addr) public onlyAuthorizedChanger()
    {
        _setCoinPair(coinPair, address(addr));
    }

    /// @notice Unregister a coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array.
    function unRegisterCoinPair(bytes32 coinPair, uint256 hint) public onlyAuthorizedChanger() {
        _unRegisterCoinPair(coinPair, hint);
    }

}
