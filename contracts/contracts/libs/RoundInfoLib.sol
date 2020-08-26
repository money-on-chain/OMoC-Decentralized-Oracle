// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {OracleRoundInfoLib} from "./OracleRoundInfoLib.sol";
import {AddressSetLib} from "./AddressSetLib.sol";

/**
  @notice Manage round specific information
 */
library RoundInfoLib {
    using SafeMath for uint256;
    using OracleRoundInfoLib for OracleRoundInfoLib.OracleRoundInfo;
    using AddressSetLib for AddressSetLib.AddressSet;

    /// Global registration information for each oracle, used by OracleManager
    struct RoundInfo {
        // Number of this round
        uint256 number;
        // Total points accumulated in round.
        uint256 totalPoints;
        // The starting block of period where this round is valid.
        uint256 startBlock;
        // The  timestamp where this round lock terminates (can be switched out).
        uint256 lockPeriodTimestamp;
        // The maximum count of oracles selected to participate each round
        uint256 maxOraclesPerRound;
        // The duration in secs before a SwitchRound can occur.
        uint256 roundLockPeriodSecs;
        // The number of rounds an oracle must be idle (not participating) before a removal
        uint8 numIdleRounds;
        // The selected oracles that participate in this round.
        AddressSetLib.AddressSet selectedOracles;
        // Per-oracle round Info.
        mapping(address => OracleRoundInfoLib.OracleRoundInfo) oracleRoundInfo;
    }

    /**
     * Initialize a register info structure
     */
    function initRoundInfo(
        uint256 _maxOraclesPerRound,
        uint256 _roundLockPeriod,
        uint8 _numIdleRounds
    ) internal pure returns (RoundInfo memory) {
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(_roundLockPeriod > 0, "The round lock period must be positive and non zero");
        require(_numIdleRounds >= 1, "The number of rounds an oracle must be idle must be >= 1");
        return
            RoundInfo(
                0,
                0,
                0,
                0,
                _maxOraclesPerRound,
                _roundLockPeriod,
                _numIdleRounds,
                AddressSetLib.init()
            );
    }

    function isFull(RoundInfo storage _self) internal view returns (bool) {
        return _self.selectedOracles.length() >= _self.maxOraclesPerRound;
    }

    function isSelected(RoundInfo storage _self, address _oracleAddr) internal view returns (bool) {
        return _self.selectedOracles.contains(_oracleAddr);
        // return _self.oracleRoundInfo[_oracleAddr].isInRound(_self.number);
    }

    function length(RoundInfo storage _self) internal view returns (uint256) {
        return _self.selectedOracles.length();
    }

    function at(RoundInfo storage _self, uint256 idx) internal view returns (address) {
        return _self.selectedOracles.at(idx);
    }

    function contains(RoundInfo storage _self, address addr) internal view returns (bool) {
        return _self.selectedOracles.contains(addr);
    }

    function asArray(RoundInfo storage _self) internal view returns (address[] memory) {
        return _self.selectedOracles.asArray();
    }

    // TODO: Remove this method and all related info:  _self.numIdleRounds, _self.selectedInRound, etc.
    function canRemoveOracle(RoundInfo storage _self, address _oracleAddr)
        internal
        view
        returns (bool)
    {
        uint256 selectedInRound = _self.oracleRoundInfo[_oracleAddr].getSelectedInRound();
        if (selectedInRound == 0) return true;
        return _self.number >= _self.numIdleRounds + selectedInRound;
    }

    function addPoints(
        RoundInfo storage _self,
        address _oracleAddr,
        uint256 _points
    ) internal {
        _self.oracleRoundInfo[_oracleAddr].addPoints(_points);
        _self.totalPoints = _self.totalPoints + _points;
    }

    function clearSelectedOracles(RoundInfo storage _self) internal {
        _self.selectedOracles.clear();
    }

    function addOracleToRound(RoundInfo storage _self, address _oracleAddr) internal {
        _self.selectedOracles.add(_oracleAddr);
        _self.oracleRoundInfo[_oracleAddr].setSelectedInRound(_self.number);
    }

    function removeOracleFromRound(RoundInfo storage _self, address _oracleAddr) internal {
        _self.selectedOracles.remove(_oracleAddr);
        _self.oracleRoundInfo[_oracleAddr].points = 0;
    }

    function isReadyToSwitch(RoundInfo storage _self) internal view returns (bool) {
        return block.timestamp > _self.lockPeriodTimestamp;
    }

    function switchRound(RoundInfo storage _self) internal {
        for (uint256 i = 0; i < _self.selectedOracles.length(); i++) {
            _self.oracleRoundInfo[_self.selectedOracles.at(i)].clearPoints();
        }
        _self.number = _self.number + 1;
        _self.totalPoints = 0;
        _self.startBlock = block.number + 1;
        _self.lockPeriodTimestamp = block.timestamp + 1 + _self.roundLockPeriodSecs;
    }

    function getOracleRoundInfo(RoundInfo storage _self, address _oracleAddr)
        internal
        view
        returns (
            uint256 points,
            uint256 selectedInRound,
            bool selectedInCurrentRound
        )
    {
        return (
            _self.oracleRoundInfo[_oracleAddr].points,
            _self.oracleRoundInfo[_oracleAddr].selectedInRound,
            _self.oracleRoundInfo[_oracleAddr].selectedInRound == _self.number
        );
    }

    /// @notice Return current round information
    function getRoundInfo(RoundInfo storage _self)
        internal
        view
        returns (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            address[] memory selectedOracles
        )
    {
        return (
            _self.number,
            _self.startBlock,
            _self.lockPeriodTimestamp,
            _self.totalPoints,
            _self.selectedOracles.asArray()
        );
    }

    function getPoints(RoundInfo storage _self, address _oracleAddr)
        internal
        view
        returns (uint256 points)
    {
        return _self.oracleRoundInfo[_oracleAddr].points;
    }
}
