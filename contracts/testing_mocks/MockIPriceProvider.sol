// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IPriceProvider} from "@money-on-chain/omoc-sc-shared/contracts/IPriceProvider.sol";

/**
  @title MockIPriceProvider
  @notice This contract is not intended to be used in a production system
          It was designed to be using in a testing environment only
          A mock ipriceprovider that return a fixed price and fail status.
  */
contract MockIPriceProvider is IPriceProvider {
    bytes32 public price;
    bool public fail;
    uint256 public lastPubBlock;

    constructor(
        uint256 _price,
        bool _fail,
        uint256 _lastPubBlock
    ) public {
        price = bytes32(_price);
        fail = _fail;
        lastPubBlock = _lastPubBlock;
    }

    function peek() external override view returns (bytes32, bool) {
        return (price, fail);
    }

    // Return the current price.
    function getPrice() external override view returns (uint256) {
        return uint256(price);
    }

    // Return if the price is not expired.
    function getIsValid() external override view returns (bool) {
        return fail;
    }

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external override view returns (uint256) {
        return lastPubBlock;
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        override
        view
        returns (
            uint256,
            bool,
            uint256
        )
    {
        return (uint256(price), fail, lastPubBlock);
    }
}
