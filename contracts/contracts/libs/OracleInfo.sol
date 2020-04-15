pragma solidity ^0.6.0;

import {SafeMath} from "../openzeppelin/math/SafeMath.sol";

/**
  @notice Manage information specific to each oracle
 */
library OracleInfoLib {
    using SafeMath for uint;

    /// Global registration information for each oracle
    struct OracleRegisterInfo
    {
        string internetName;
        address owner;
    }

    function initRegisterInfo(address owner, string memory internetName) internal pure returns (OracleRegisterInfo memory){
        return OracleRegisterInfo(internetName, owner);
    }

    function isRegistered(OracleRegisterInfo storage _self) internal view returns (bool) {
        return (_self.owner != address(0));
    }

    function getOwner(OracleRegisterInfo storage _self) internal view returns (address) {
        return _self.owner;
    }

    function isOwner(OracleRegisterInfo storage _self, address cmp) internal view returns (bool) {
        return _self.owner == cmp;
    }

    function getName(OracleRegisterInfo storage _self) internal view returns (string memory) {
        return _self.internetName;
    }

    function setName(OracleRegisterInfo storage _self, string memory name) internal {
        _self.internetName = name;
    }

    /// Round-level registration information for each-oracle
    struct OracleRoundInfo
    {
        uint points;
        uint256 selectedInRound;
    }

    function initRoundInfo(uint points, uint256 selectedInRound) internal pure returns (OracleRoundInfo memory) {
        return OracleRoundInfo(points, selectedInRound);
    }

    function isInRound(OracleRoundInfo storage _self, uint256 roundNum) internal view returns (bool) {
        return _self.selectedInRound == roundNum;
    }

    function getSelectedInRound(OracleRoundInfo storage _self) internal view returns (uint256) {
        return _self.selectedInRound;
    }

    function setSelectedInRound(OracleRoundInfo storage _self, uint roundNum) internal {
        _self.selectedInRound = roundNum;
    }

    function getPoints(OracleRoundInfo storage _self) internal view returns (uint256) {
        return _self.points;
    }

    function addPoints(OracleRoundInfo storage _self, uint points) internal {
        _self.points = _self.points + points;
    }

    function clearPoints(OracleRoundInfo storage _self) internal {
        _self.points = 0;
    }
}