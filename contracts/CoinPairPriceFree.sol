// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IPriceProvider} from "@moc/shared/contracts/IPriceProvider.sol";
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

    // Return the current price.
    function getPrice() external override view returns (uint256) {
        (bytes32 price, ) = coinPairPrice.peek();
        return uint256(price);
    }

    // Return if the price is not expired.
    function getIsValid() external override view returns (bool) {
        (, bool valid) = coinPairPrice.peek();
        return valid;
    }

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external override view returns (uint256) {
        return coinPairPrice.getLastPublicationBlock();
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        override
        view
        returns (
            uint256 price,
            bool isValid,
            uint256 lastPubBlock
        )
    {
        // This is compatible with the old implementation of a coinPairPrice
        lastPubBlock = coinPairPrice.getLastPublicationBlock();
        bytes32 price32;
        (price32, isValid) = coinPairPrice.peek();
        return (uint256(price32), isValid, lastPubBlock);
    }
}
