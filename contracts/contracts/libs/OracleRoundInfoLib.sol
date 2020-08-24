// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
  @notice Manage pero oracleround specific information
 */
library OracleRoundInfoLib {
    using SafeMath for uint;

    /// PerRound-level registration information for each-oracle used by each CoinPairPrice
    struct OracleRoundInfo
    {
        uint points;
        uint256 selectedInRound;
    }

    function initOracleRoundInfo() internal pure returns (OracleRoundInfo memory) {
        return OracleRoundInfo(0, 0);
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