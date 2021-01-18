// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {AddressSetLib} from "@moc/shared/contracts/lib/AddressSetLib.sol";

/**
  @notice Manage round specific information
 */
library RoundInfoLib {
    using SafeMath for uint256;
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
        // The minimum count of oracles selected to participate each round
        uint256 minOraclesPerRound;
        // The maximum count of oracles selected to participate each round
        uint256 maxOraclesPerRound;
        // The duration in secs before a SwitchRound can occur.
        uint256 roundLockPeriodSecs;
        // The selected oracles that participate in this round.
        AddressSetLib.AddressSet selectedOracles;
        // Per-oracle round Info.
        mapping(address => uint256) points;
    }

    /**
     * Initialize a register info structure
     */
    function initRoundInfo(
        uint256 _minOraclesPerRound,
        uint256 _maxOraclesPerRound,
        uint256 _roundLockPeriod
    ) internal pure returns (RoundInfo memory) {
        require(_minOraclesPerRound > 0, "The minimum oracles per round must be >0");
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(_roundLockPeriod > 0, "The round lock period must be positive and non zero");
        return
            RoundInfo({
                number: 1,
                totalPoints: 0,
                startBlock: 0,
                lockPeriodTimestamp: 0,
                minOraclesPerRound: _minOraclesPerRound,
                maxOraclesPerRound: _maxOraclesPerRound,
                roundLockPeriodSecs: _roundLockPeriod,
                selectedOracles: AddressSetLib.init()
            });
    }

    function isFull(RoundInfo storage _self) internal view returns (bool) {
        return _self.selectedOracles.length() >= _self.maxOraclesPerRound;
    }

    function isSelected(RoundInfo storage _self, address _ownerAddr) internal view returns (bool) {
        return _self.selectedOracles.contains(_ownerAddr);
    }

    function length(RoundInfo storage _self) internal view returns (uint256) {
        return _self.selectedOracles.length();
    }

    function at(RoundInfo storage _self, uint256 idx) internal view returns (address) {
        return _self.selectedOracles.at(idx);
    }

    function contains(RoundInfo storage _self, address _ownerAddr) internal view returns (bool) {
        return _self.selectedOracles.contains(_ownerAddr);
    }

    function asArray(RoundInfo storage _self) internal view returns (address[] memory) {
        return _self.selectedOracles.asArray();
    }

    function addPoints(
        RoundInfo storage _self,
        address _oracleAddr,
        uint256 _points
    ) internal {
        _self.points[_oracleAddr] = _self.points[_oracleAddr].add(_points);
        _self.totalPoints = _self.totalPoints + _points;
    }

    function addOracleToRound(RoundInfo storage _self, address _ownerAddr) internal {
        _self.selectedOracles.add(_ownerAddr);
    }

    function removeOracleFromRound(RoundInfo storage _self, address _ownerAddr) internal {
        _self.selectedOracles.remove(_ownerAddr);
        delete _self.points[_ownerAddr];
    }

    function isReadyToSwitch(RoundInfo storage _self) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp > _self.lockPeriodTimestamp;
    }

    function switchRound(RoundInfo storage _self) internal {
        for (uint256 i = 0; i < _self.selectedOracles.length(); i++) {
            delete _self.points[_self.selectedOracles.at(i)];
        }
        _self.number = _self.number + 1;
        _self.totalPoints = 0;
        _self.startBlock = block.number + 1;
        // solhint-disable-next-line not-rely-on-time
        _self.lockPeriodTimestamp = block.timestamp + 1 + _self.roundLockPeriodSecs;
        _self.selectedOracles.clear();
    }

    function getOracleRoundInfo(RoundInfo storage _self, address _ownerAddr)
        internal
        view
        returns (uint256 points, bool selectedInCurrentRound)
    {
        return (_self.points[_ownerAddr], _self.selectedOracles.contains(_ownerAddr));
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
            address[] memory selectedOwners
        )
    {
        return (
            _self.number,
            _self.startBlock,
            _self.lockPeriodTimestamp,
            _self.totalPoints,
            asArray(_self)
        );
    }

    function getPoints(RoundInfo storage _self, address _oracleAddr)
        internal
        view
        returns (uint256 points)
    {
        return _self.points[_oracleAddr];
    }
}
