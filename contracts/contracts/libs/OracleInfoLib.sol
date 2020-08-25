// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
  @notice Manage information specific to each oracle
 */
library OracleInfoLib {
    using SafeMath for uint256;

    /// Global registration information for each oracle, used by OracleManager
    struct OracleRegisterInfo {
        string internetName;
        address owner;
    }

    /**
     * Initialize a register info structure
     */
    function initRegisterInfo(address owner, string memory internetName)
        internal
        pure
        returns (OracleRegisterInfo memory)
    {
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
}
