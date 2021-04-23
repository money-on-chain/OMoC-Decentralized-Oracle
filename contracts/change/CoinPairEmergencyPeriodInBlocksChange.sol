// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";

/**
  @title CoinPairEmergencyPeriodInBlocksChange
  @notice This contract is a ChangeContract intended to be used to change the emergency publisher period in blocks.
 */
contract CoinPairEmergencyPeriodInBlocksChange is CoinPairPriceStorage, ChangeContract {
    Governed public coinPairPrice;
    bytes public encodedData;

    /**
      @notice Constructor
      @param _coinPairPrice Address of coin pair price to upgrade
      @param _emergencyPublishingPeriodInBlocks The emergencyPublishingPeriodInBlocks value
    */
    constructor(Governed _coinPairPrice, uint256 _emergencyPublishingPeriodInBlocks) public {
        coinPairPrice = _coinPairPrice;
        encodedData = abi.encode(_emergencyPublishingPeriodInBlocks);
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
        emergencyPublishingPeriodInBlocks = abi.decode(data, (uint256));
    }
}
