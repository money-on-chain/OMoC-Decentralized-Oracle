// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {ChangeContract} from "@moc/shared/contracts/moc-governance/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";
import {CoinPairPriceStorage} from "../CoinPairPriceStorage.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {OracleManagerStorage} from "../OracleManagerStorage.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerPairChangeListUpdate is
    CoinPairPriceStorage,
    OracleManagerStorage,
    ChangeContract
{
    OracleManager public oracleManager_;
    bytes32[] public coinPairsToAdd;
    address[] public contractAddrToAdd;
    address[] public wlist;
    bytes32[] public coinPairsToRemove;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _coinPairsToAdd The list of coinpairs to register
      @param _contractAddrToAdd The list of coinpairs contract implementation addresses
      @param _wlist The list of emergency price feeder addresses
      @param _coinPairsToRemove The list of coinpairs contract implementation addresses to remove
    */
    constructor(
        OracleManager _oracleManager,
        bytes32[] memory _coinPairsToAdd,
        address[] memory _contractAddrToAdd,
        address[] memory _wlist,
        bytes32[] memory _coinPairsToRemove
    ) public {
        require(_coinPairsToAdd.length == _contractAddrToAdd.length, "not have same length");
        oracleManager_ = _oracleManager;
        coinPairsToAdd = _coinPairsToAdd;
        contractAddrToAdd = _contractAddrToAdd;
        wlist = _wlist;
        coinPairsToRemove = _coinPairsToRemove;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        if (coinPairsToAdd.length > 0) {
            for (uint256 i = 0; i < coinPairsToAdd.length; i++) {
                if (wlist.length > 0) {
                    for (uint256 j = 0; j < wlist.length; j++) {
                        Governed(contractAddrToAdd[i]).delegateCallToChanger(
                            abi.encode(1, wlist[j], 0)
                        );
                    }
                }
                oracleManager_.registerCoinPair(coinPairsToAdd[i], contractAddrToAdd[i]);
            }
        }
        if (coinPairsToRemove.length > 0) {
            for (uint256 i = 0; i < coinPairsToRemove.length; i++) {
                oracleManager_.delegateCallToChanger(abi.encode(2, 0, coinPairsToRemove[i]));
            }
        }
        // TODO: Make it usable just once.
    }

    /**
        Called by the Governed contract delegateCallToChanger method
        This methods runs in the Governed contract storage.
    */
    function impersonate(bytes calldata data) external {
        (uint256 _idx, address _addToWhiteAddr, bytes32 _coinPair) = abi.decode(
            data,
            (uint256, address, bytes32)
        );

        if (_idx == 1) {
            emergencyPublishWhitelistData._addToWhitelist(_addToWhiteAddr);
        }

        if (_idx == 2) {
            coinPairRegisterData._unRegisterCoinPair(_coinPair, 0);
        }
    }
}
