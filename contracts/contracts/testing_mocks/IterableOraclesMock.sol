// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IterableOraclesLib} from "../libs/IterableOraclesLib.sol";

/*
    Test for IterableOracles library.
*/
contract IterableOraclesMock {
    using IterableOraclesLib for IterableOraclesLib.IterableOraclesData;

    IterableOraclesLib.IterableOraclesData iterableOracles;

    function isOracleRegistered(address oracleAddress) public view returns (bool) {
        return iterableOracles._isOracleRegistered(oracleAddress);
    }

    function isOwnerRegistered(address owner) public view returns (bool) {
        return iterableOracles._isOwnerRegistered(owner);
    }

    function registerOracle(
        address owner,
        address oracle,
        string memory url
    ) public {
        iterableOracles._registerOracle(owner, oracle, url);
    }

    function removeOracle(address owner) public {
        iterableOracles._removeOracle(owner);
    }

    function setName(address owner, string memory url) public {
        iterableOracles._setName(owner, url);
    }

    function setOracleAddress(address owner, address oracleAddress) public {
        iterableOracles._setOracleAddress(owner, oracleAddress);
    }

    function getLen() public view returns (uint256) {
        return iterableOracles._getLen();
    }

    function getOracleAtIndex(uint256 index)
        public
        view
        returns (
            address ownerAddress,
            address oracleAddress,
            string memory url
        )
    {
        return iterableOracles._getOracleAtIndex(index);
    }

    function getOwner(address oracleAddress) public view returns (address) {
        return iterableOracles._getOwner(oracleAddress);
    }

    function getOracleInfo(address owner)
        public
        view
        returns (address oracleAddress, string memory url)
    {
        return iterableOracles._getOracleInfo(owner);
    }

    function getOracleAddress(address owner) public view returns (address) {
        return iterableOracles._getOracleAddress(owner);
    }

    function getInternetName(address owner) public view returns (bool found, string memory url) {
        return iterableOracles._getInternetName(owner);
    }
}
