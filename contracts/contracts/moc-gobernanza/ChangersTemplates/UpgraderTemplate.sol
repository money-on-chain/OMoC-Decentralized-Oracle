// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "../IOZAdminUpgradeabilityProxy.sol";
import "../Governance/ChangeContract.sol";
import "../Upgradeability/UpgradeDelegator.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract UpgraderTemplate is ChangeContract {

    IOZAdminUpgradeabilityProxy public proxy;
    UpgradeDelegator public upgradeDelegator;
    address public newImplementation;

    /**
      @notice Constructor
      @param _proxy Address of the proxy to be upgraded
      @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
      @param _newImplementation Address of the contract the proxy will delegate to
    */
    constructor(IOZAdminUpgradeabilityProxy _proxy, UpgradeDelegator _upgradeDelegator, address _newImplementation) public {
        proxy = _proxy;
        upgradeDelegator = _upgradeDelegator;
        newImplementation = _newImplementation;
    }
    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
      IMPORTANT: This function should not be overriden, you should only redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        require(newImplementation != address(0), "New Implementation address must be valid");
        _beforeUpgrade();
        _upgrade();
        _afterUpgrade();
    }

    /**
      @notice Upgrade the proxy to the newImplementation
      @dev IMPORTANT: This function should not be overriden
     */
    function _upgrade() internal {
        upgradeDelegator.upgrade(proxy, newImplementation);
        // Usable just once.
        newImplementation = address(0);
    }

    /**
      @notice Intended to prepare the system for the upgrade
      @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
     */
    function _beforeUpgrade() internal {
    }

    /**
      @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
      @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
     */
    function _afterUpgrade() internal {
    }
}
