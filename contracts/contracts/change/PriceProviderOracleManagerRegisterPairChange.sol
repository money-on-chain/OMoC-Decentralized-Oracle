pragma solidity 0.6.0;

import "../moc-gobernanza/Governance/ChangeContract.sol";
import "../OracleManager.sol";
import "../CoinPairPrice.sol";
import "../PriceProviderRegister.sol";
import "../IPriceProviderRegisterEntry.sol";

/**
  @title UpgraderTemplate
  @notice This contract is a ChangeContract intended to be used when
  upgrading any contract upgradeable through the zos-lib upgradeability
  system. This doesn't initialize the upgraded contract, that should be done extending
  this one or taking it as a guide
 */
contract PriceProviderOracleManagerRegisterPairChange is ChangeContract {
    PriceProviderRegister public priceProviderRegister;
    OracleManager public oracleManager;

    /**
      @notice Constructor
      @param _priceProviderRegister Address of register contract used to register the coin pairs
      @param _oracleManager Oracle manager, used to register all the coinpairs
    */
    constructor(PriceProviderRegister _priceProviderRegister, OracleManager _oracleManager) public {
        priceProviderRegister = _priceProviderRegister;
        oracleManager = _oracleManager;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
      the current architecture
      IMPORTANT: This function should not be overriden, you should only redefine the _beforeUpgrade and _afterUpgrade to use this template
     */
    function execute() external override {
        uint coinPairCount = oracleManager.getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++)
        {
            bytes32 coinPair = oracleManager.getCoinPairAtIndex(i);
            address contractAddr = oracleManager.getContractAddress(coinPair);
            priceProviderRegister.registerCoinPair(coinPair, IPriceProviderRegisterEntry(contractAddr));
        }
        // usable just once!!!
        // priceProviderRegister = address(0);
    }

}
