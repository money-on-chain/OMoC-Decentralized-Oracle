#!/usr/bin/env bash

FLATTENER="/usr/bin/env python3 scripts/flattener.py"
OUTPUTDIR="scripts/contract_flatten/"
CONTRACTS=(
    "contracts/PriceProviderRegisterStorage.sol"
    "contracts/CalculatedPriceProviderStorage.sol"
    "contracts/PriceProviderRegister.sol"
    "contracts/change/OracleManagerUnsubscribeChange.sol"
    "contracts/change/CoinPairPriceSetRegistryChange.sol"
    "contracts/change/TestMOCMintChange.sol"
    "contracts/change/CoinPairEmergencyWhitelistListChange.sol"
    "contracts/change/PriceProviderOracleManagerRegisterPairChange.sol"
    "contracts/change/MocRegistrySchedulerDelayChange.sol"
    "contracts/change/SupportersStopPeriodChange.sol"
    "contracts/change/CoinPairEmergencyPeriodInBlocksChange.sol"
    "contracts/change/MocRegistryOracleGatherSignatureTimeoutChange.sol"
    "contracts/change/CoinPairPriceValidPricePeriodInBlocksChange.sol"
    "contracts/change/CoinPairEmergencyWhitelistChange.sol"
    "contracts/change/MocRegistryEnteringFallbacksAmountsChange.sol"
    "contracts/change/PriceProviderRegisterPairChange.sol"
    "contracts/change/OracleManagerOracleMinStakeChange.sol"
    "contracts/change/MocRegistryAddMinOraclesPerRoundChange.sol"
    "contracts/change/OracleManagerPairChange.sol"
    "contracts/change/OracleManagerPairChangeList.sol"
    "contracts/change/OracleManagerPairChangeListWL.sol"
    "contracts/change/OracleManagerPairChangeRemove.sol"  
    "contracts/change/OracleManagerRemoveChange.sol"
    "contracts/change/CoinPairPriceAddCalculatedPriceProviderChange.sol"
    "contracts/change/MocRegistryInitChange.sol"
    "contracts/change/CoinPairPriceMaxOraclesPerRoundChange.sol"
    "contracts/change/CoinPairPriceRoundLockPeriodChange.sol"
    "contracts/change/SupportersPeriodAndEndChange.sol"
    "contracts/change/SupportersPeriodChange.sol"
    "contracts/change/GovernorChange.sol"
    "contracts/CoinPairPrice.sol"
    "contracts/CoinPairPriceFree.sol"
    "contracts/StakingStorage.sol"
    "contracts/CalculatedPriceProvider.sol"
    "contracts/Supporters.sol"
    "contracts/DelayMachineStorage.sol"
    "contracts/InfoGetter.sol"
    "contracts/CoinPairPriceStorage.sol"
    "contracts/DelayMachine.sol"
    "contracts/Migrations.sol"
    "contracts/OracleManagerStorage.sol"
    "contracts/SupportersStorage.sol"
    "contracts/OracleManager.sol"
    "contracts/Staking.sol"
)

# Working directory: the root of the project
cd "$(dirname "$0")/.."

echo "Starting to flatten our contracts"

# Iterate the contract list 
for CONTRACT in "${CONTRACTS[@]}"; do

    echo File: $(basename "$CONTRACT")

    # Output file
    OUTPUTFILE=$OUTPUTDIR$(basename "$CONTRACT" .sol)_flat.sol

    # Flattener...
    $FLATTENER $CONTRACT > $OUTPUTFILE

done

echo "Finished! Take a look into folder $OUTPUTDIR..."
