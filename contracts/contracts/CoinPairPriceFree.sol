// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPriceFree is Initializable, IPriceProvider {
    IPriceProvider public coinPairPrice;

    function initialize(IPriceProvider _coinPairPrice) public initializer {
        coinPairPrice = _coinPairPrice;
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek() external override view returns (bytes32, bool) {
        return coinPairPrice.peek();
    }
}
