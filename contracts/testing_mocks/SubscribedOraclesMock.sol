// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SubscribedOraclesLib} from "../libs/SubscribedOraclesLib.sol";
import {AddressSetLib} from "../libs/AddressSetLib.sol";

/*
    Test for subscribed oracles library.
*/
contract SubscribedOraclesMock {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;
    using AddressSetLib for AddressSetLib.AddressSet;

    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    mapping(address => uint256) public stakes;

    uint256 public maxSubscribedOraclesPerRound;

    AddressSetLib.AddressSet internal selectedOracles;

    constructor(uint256 _maxSubscribedOraclesPerRound) public {
        maxSubscribedOraclesPerRound = _maxSubscribedOraclesPerRound;
        subscribedOracles = SubscribedOraclesLib.init();
    }

    function addOrReplace(address oracle, uint256 stake) public {
        if (subscribedOracles.length() < maxSubscribedOraclesPerRound) {
            subscribedOracles.add(oracle);
            setStake(oracle, stake);
            return;
        }
        (uint256 minStake, address minVal) = subscribedOracles.getMin(this.getStake);
        if (stake > minStake) {
            if (subscribedOracles.remove(minVal)) {
                subscribedOracles.add(oracle);
                setStake(oracle, stake);
            }
        }
    }

    function getMin() public view returns (uint256 minStake, address minVal) {
        return subscribedOracles.getMin(this.getStake);
    }

    function remove(address oracle) public {
        subscribedOracles.remove(oracle);
        setStake(oracle, 0);
    }

    function contains(address oracle) public view returns (bool) {
        return subscribedOracles.contains(oracle);
    }

    function sort(uint256 count) public view returns (address[] memory) {
        return subscribedOracles.sort(this.getStake, count);
    }

    function sortForGas(uint256 count) public returns (address[] memory) {
        // Only to avoid warning that function can be view
        maxSubscribedOraclesPerRound = maxSubscribedOraclesPerRound;
        return subscribedOracles.sort(this.getStake, count);
    }

    function selectOracles(uint256 count) public {
        address[] memory selected = subscribedOracles.sort(this.getStake, count);
        for (uint256 i = 0; i < selected.length; i += 1) {
            selectedOracles.add(selected[i]);
        }
    }

    function getSelectedOracles() public view returns (address[] memory selected) {
        return selectedOracles.asArray();
    }

    function onWithdraw(address oracleOwnerAddr, bool _remove) public {
        (address addr, ) = subscribedOracles.getMaxUnselectedStake(
            this.getMaxStake,
            selectedOracles
        );
        if (_remove) {
            selectedOracles.remove(oracleOwnerAddr);
            selectedOracles.add(addr);
        }
    }

    function length() public view returns (uint256) {
        return subscribedOracles.length();
    }

    function setStake(address oracle, uint256 stake) public {
        stakes[oracle] = stake;
    }

    function getStake(address oracle) external view returns (uint256) {
        return stakes[oracle];
    }

    function getMaxStake(address[] calldata oracles) external view returns (address, uint256) {
        if (oracles.length == 0) {
            return (address(0x0), 0);
        }
        address maxAddress = oracles[0];
        uint256 maxStake = stakes[maxAddress];
        for (uint256 i = 1; i < oracles.length; i += 1) {
            if (stakes[oracles[i]] > maxStake) {
                maxAddress = oracles[i];
                maxStake = stakes[maxAddress];
            }
        }
        return (maxAddress, maxStake);
    }
}
