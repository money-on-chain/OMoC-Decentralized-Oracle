// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerPairChangeListWL is CoinPairPriceStorage, ChangeContract {
    OracleManager public oracleManager_;
    bytes32[] public coinPairs;
    address[] public contractAddr;
    address[] public wlist;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _coinPairs The list of coinpairs to register
      @param _contractAddr The list of coinpairs contract implementation addresses
      @param _wlist The list of emergency price feeder addresses
    */
    constructor(
        OracleManager _oracleManager,
        bytes32[] memory _coinPairs,
        address[] memory _contractAddr,
        address[] memory _wlist
    ) public {
        require(_coinPairs.length != 0, "coinPairs list must have at least one element");
        require(_wlist.length != 0, "white list must have at least one element");
        require(
            _coinPairs.length == _contractAddr.length,
            "coinPairs and contractAddr list must have same length"
        );
        oracleManager_ = _oracleManager;
        coinPairs = _coinPairs;
        contractAddr = _contractAddr;
        wlist = _wlist;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        for (uint256 i = 0; i < coinPairs.length; i++) {
            for (uint256 j = 0; j < wlist.length; j++) {
                Governed(contractAddr[i]).delegateCallToChanger(abi.encode(wlist[i]));
            }
            oracleManager_.registerCoinPair(coinPairs[i], contractAddr[i]);
        }
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
