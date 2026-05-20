// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

/**
 * @dev Interface of the old MOC Oracle
 */
interface IPriceProvider {
    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek() external view returns (bytes32, bool);

    // Return the current price.
    function getPrice() external view returns (uint256);

    // Return if the price is not expired.
    function getIsValid() external view returns (bool);

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external view returns (uint256);

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo() external view returns (uint256 price, bool isValid, uint256 lastPubBlock);
}
