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
contract OracleManagerPairChange is ChangeContract {

    OracleManager public oracleManager;
    bytes32 public coinPair;
    address public contractAddr;

    /**
      @notice Constructor
      @param _oracleManager Address of oracle manager used to register the coin pair
      @param _coinPair The coinpair to register
      @param _contractAddr The coinpair contract implementation address
    */
    constructor(OracleManager _oracleManager, bytes32 _coinPair, address _contractAddr) public {
        oracleManager = _oracleManager;
        coinPair = _coinPair;
        contractAddr = _contractAddr;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because
      it is not its responsability in the current architecture
      IMPORTANT: This function should not be overriden, you should only
      redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        oracleManager.registerCoinPair(coinPair, contractAddr);
        // TODO: Make it usable just once.
    }

}
