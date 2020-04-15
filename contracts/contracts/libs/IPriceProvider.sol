pragma solidity ^0.6.0;

/**
 * @dev Interface of the old MOC Oracle
 */
interface IPriceProvider {
  function peek() external view returns (bytes32, bool);
}