// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {GovernedAbstract} from "../libs/GovernedAbstract.sol";
/**
  @title CoinPairEmergencyWhitelistChange
  @notice This contract is a ChangeContract intended to be used to add an emergency publisher to the whitelist.
 */
contract CoinPairEmergencyWhitelistChange is CoinPairPriceStorage, ChangeContract {

    GovernedAbstract public coinPairPrice;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _emergencyPublisher The address of the publisher to whitelist
    */
    constructor(GovernedAbstract _coinPairPrice, address _emergencyPublisher) public {
        coinPairPrice = _coinPairPrice;
        encodedData = abi.encode(_emergencyPublisher);
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
     */
    function execute() external override {
        coinPairPrice.delegateCallToChanger(encodedData);
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        emergencyPublishWhitelistData._addToWhitelist(abi.decode(data, (address)));
    }
}
