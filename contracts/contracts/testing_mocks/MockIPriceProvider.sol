pragma solidity ^0.6.0;

import "../libs/IPriceProvider.sol";

/**
  @title MockIPriceProvider
  @notice This contract is not intended to be used in a production system
          It was designed to be using in a testing environment only
          A mock ipriceprovider that return a fixed price and fail status.
  */
contract MockIPriceProvider is IPriceProvider {

    bytes32 public price;
    bool public fail;

    constructor (uint256 _price, bool _fail) public {
        price = bytes32(_price);
        fail = _fail;
    }

    function peek() external override view returns (bytes32, bool) {
        return (price, fail);
    }
}
