pragma solidity 0.6.0;


import "../IOZAdminUpgradeabilityProxy.sol";
import "../IOZProxyAdmin.sol";
import "../Governance/Governed.sol";

/**
  @title UpgradeDelegator
  @notice Dispatches to the proxyAdmin any call made through the governance system
  @dev Adapter between our governance system and the zeppelinOS proxyAdmin. This is
  needed to be able to upgrade governance through the same system

 */
contract UpgradeDelegator is Governed {
    IOZProxyAdmin public proxyAdmin;

    function initialize(IGovernor _governor, IOZProxyAdmin _proxyAdmin) public initializer {
        Governed.initialize(_governor);
        proxyAdmin = _proxyAdmin;
    }

    /**
     * @dev Returns the current implementation of a proxy.
     * This is needed because only the proxy admin can query it.
     * @return The address of the current implementation of the proxy.
     */
    function getProxyImplementation(IOZAdminUpgradeabilityProxy proxy) public view returns (address) {
        return proxyAdmin.getProxyImplementation(proxy);
    }

    /**
     * @dev Returns the admin of a proxy. Only the admin can query it.
     * @return The address of the current admin of the proxy.
     */
    function getProxyAdmin(IOZAdminUpgradeabilityProxy proxy) public view returns (address) {
        return proxyAdmin.getProxyAdmin(proxy);
    }

    /**
     * @dev Changes the admin of a proxy.
     * @param proxy Proxy to change admin.
     * @param newAdmin Address to transfer proxy administration to.
     */
    function changeProxyAdmin(IOZAdminUpgradeabilityProxy proxy, address newAdmin) public onlyAuthorizedChanger {
        proxyAdmin.changeProxyAdmin(proxy, newAdmin);
    }

    /**
     * @dev Upgrades a proxy to the newest implementation of a contract.
     * @param proxy Proxy to be upgraded.
     * @param implementation the address of the Implementation.
     */
    function upgrade(IOZAdminUpgradeabilityProxy proxy, address implementation) public onlyAuthorizedChanger {
        proxyAdmin.upgrade(proxy, implementation);
    }

    /**
     * @dev Upgrades a proxy to the newest implementation of a contract and forwards a function call to it.
     * This is useful to initialize the proxied contract.
     * @param proxy Proxy to be upgraded.
     * @param implementation Address of the Implementation.
     * @param data Data to send as msg.data in the low level call.
     * It should include the signature and the parameters of the function to be called, as described in
     * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
     */
    function upgradeAndCall(IOZAdminUpgradeabilityProxy proxy, address implementation, bytes memory data) public payable onlyAuthorizedChanger {
        proxyAdmin.upgradeAndCall.value(msg.value)(proxy, implementation, data);
    }
}
