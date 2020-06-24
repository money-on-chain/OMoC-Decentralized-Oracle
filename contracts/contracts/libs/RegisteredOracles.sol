pragma solidity 0.6.0;

import {SafeMath} from "../openzeppelin/math/SafeMath.sol";
import {OracleInfoLib} from "./OracleInfo.sol";

/**
  @notice Manage the database of registered oracles (sorted by stake).
 */
library RegisteredOraclesLib {
    using SafeMath for uint;
    using OracleInfoLib for OracleInfoLib.OracleRegisterInfo;

    struct SList {
        OracleInfoLib.OracleRegisterInfo data;
        address sle_next;
    }

    struct RegisteredOracles {
        mapping(address => SList) oracleMap;
        function (address) internal view returns (uint256) getStake;
        address slh_first; /* first element */
    }

    function init(function (address) internal view returns (uint256) getStake)
    internal pure returns (RegisteredOracles memory) {
        return RegisteredOracles(getStake, address(0));
    }

    function isEmpty(RegisteredOracles storage _self) internal view returns (bool){
        return _self.slh_first == address(0);
    }

    function getHead(RegisteredOracles storage _self) internal view returns (address){
        return _self.slh_first;
    }

    function getNext(RegisteredOracles storage _self, address iterator) internal view returns (address) {
        return _self.oracleMap[iterator].sle_next;
    }

    function getByAddr(RegisteredOracles storage _self, address addr) internal view returns (OracleInfoLib.OracleRegisterInfo storage) {
        return _self.oracleMap[addr].data;
    }

    function getPrevByAddr(RegisteredOracles storage _self, address prevEntry, address addr) internal view returns (address) {
        return _sListFindPrevByAddr(_self, prevEntry, addr);
    }

    function getPrevByStake(RegisteredOracles storage _self, address prevEntry, uint stake) internal view returns (address) {
        return _sListFindPrevByStake(_self, prevEntry, stake);
    }

    function add(RegisteredOracles storage _self, address addr, string memory internetName, address prevEntry) internal {
        _self.oracleMap[addr] = SList(OracleInfoLib.initRegisterInfo(msg.sender, internetName), address(0));
        _insert(_self, addr, prevEntry);
    }

    function modify(RegisteredOracles storage _self, address addr, address removePrevEntry, address addPrevEntry) internal {
        _remove(_self, addr, removePrevEntry);
        _insert(_self, addr, addPrevEntry);
    }

    function remove(RegisteredOracles storage _self, address addr, address prevEntry) internal {
        _remove(_self, addr, prevEntry);
        delete _self.oracleMap[addr];
    }

    function _insert(RegisteredOracles storage _self, address addr, address prevEntry) private {
        address prev = _sListFindPrevByStake(_self, prevEntry, _self.getStake(addr));
        _sListInsertAfter(_self, prev, addr);
    }

    function _remove(RegisteredOracles storage _self, address addr, address prevEntry) private {
        require(addr != address(0), "Invalid address");
        require(_self.oracleMap[addr].data.isRegistered(), "Oracle not registered");

        address prev = _sListFindPrevByAddr(_self, prevEntry, addr);
        _sListRemoveNext(_self, prev);
    }


    function _sListInsertAfter(RegisteredOracles storage _self, address sListElm, address elm) private {
        if (sListElm == address(0)) {
            // insertHead
            _self.oracleMap[elm].sle_next = _self.slh_first;
            _self.slh_first = elm;
        } else {
            _self.oracleMap[elm].sle_next = _self.oracleMap[sListElm].sle_next;
            _self.oracleMap[sListElm].sle_next = elm;
        }
    }


    function _sListRemoveNext(RegisteredOracles storage _self, address sListElm) private {
        if (sListElm == address(0)) {
            // Remove Head
            _self.slh_first = _self.oracleMap[_self.slh_first].sle_next;
        } else {
            address next = _self.oracleMap[sListElm].sle_next;
            _self.oracleMap[sListElm].sle_next = _self.oracleMap[next].sle_next;
        }
    }

    // TODO: Implement a partial search with some gas limit
    function _sListFindPrevByStake(RegisteredOracles storage _self, address prevEntry, uint stake) private view returns (address) {
        address prev = prevEntry;
        // The entry is the greatest, or the user want to start from the head.
        if (prev == address(0)) {
            if (_self.slh_first == address(0) || _self.getStake(_self.slh_first) < stake) {
                return address(0);
            }
            prev = _self.slh_first;
        }
        require(_self.getStake(prev) >= stake, "Wrong prev entry stake");
        for (address currlm = _self.oracleMap[prev].sle_next; currlm != address(0); currlm = _self.oracleMap[currlm].sle_next) {
            if (_self.getStake(currlm) < stake) {
                break;
            }
            prev = currlm;
        }
        return prev;
    }

    // TODO: Implement a partial search with some gas limit
    function _sListFindPrevByAddr(RegisteredOracles storage _self, address prevEntry, address addr) private view returns (address) {
        if (prevEntry == address(0) && addr == _self.slh_first) {
            return address(0);
        }
        address rmPrev = prevEntry;
        if (rmPrev == address(0)) {
            // the users want to search.
            rmPrev = _self.slh_first;
        }
        for (address currlm = rmPrev; currlm != address(0); currlm = _self.oracleMap[currlm].sle_next) {
            if (currlm == addr) {
                break;
            }
            rmPrev = currlm;
        }
        require(_self.oracleMap[rmPrev].sle_next == addr, "Invalid prev entry");
        return rmPrev;
    }

}