// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";

/**
  @title CoinPairEmergencyWhitelistChange
  @notice This contract is a ChangeContract intended to be used to add an emergency publisher to the whitelist.
 */
contract CoinPairEmergencyWhitelistListChange is CoinPairPriceStorage, ChangeContract {
    Governed public coinPairPrice;
    address[] public whitelisted;
    event Result(address[]);

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
    */
    constructor(Governed _coinPairPrice) public {
        coinPairPrice = _coinPairPrice;
    }

    function getWhiteListLen() external view returns (uint256) {
        return whitelisted.length;
    }

    function getWhiteListAtIndex(uint256 i) external view returns (address) {
        return whitelisted[i];
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        bytes memory data = coinPairPrice.delegateCallToChanger("");
        whitelisted = abi.decode(data, (address[]));
        emit Result(whitelisted);
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata) external view returns (address[] memory) {
        uint256 cant = emergencyPublishWhitelistData._getWhiteListLen();
        address[] memory ret = new address[](cant);
        for (uint256 i = 0; i < cant; i++) {
            ret[i] = emergencyPublishWhitelistData._getWhiteListAtIndex(i);
        }
        return ret;
    }
}
