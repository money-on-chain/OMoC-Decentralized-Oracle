pragma solidity 0.6.0;

import {ChangeContract} from "../moc-gobernanza/Governance/ChangeContract.sol";
import {OracleManager} from "../OracleManager.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract OracleManagerUnsubscribeChange is ChangeContract {

    OracleManager public oracleManager;
    address public oracleAddr;
    bytes32 public coinPair;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _oracleAddr The coinpair contract implementation address
      @param _coinPair The coinpair to register
    */
    constructor(OracleManager _oracleManager, address _oracleAddr, bytes32 _coinPair) public {
        oracleManager = _oracleManager;
        oracleAddr = _oracleAddr;
        coinPair = _coinPair;
    }

    /**
      @notice Execute the changes.
      */
    function execute() external override {
        oracleManager.unsubscribeCoinPair(oracleAddr, coinPair);
        oracleManager = OracleManager(0);
    }

}
