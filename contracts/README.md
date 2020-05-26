# MoC Contracts

## Requirements:

```
npm install -g ganache-cli
node version 10.17.0
npm install
```

## How to build the contracts to be used on other projects (DAPP & Server):

```bash
 $ cd contracts/
 $ npm install
 $ npm install -g truffle
 $ truffle compile --all
```

## how to deploy the SmartContract:

### A.Ganache:

1) npm install -g ganache-cli
2) Run './run_ganache.sh'
3) In another tab run './scripts/FirstDeploy.sh'


### B.RSKTestnet:

1) Edit truffle-config.js at rsk_testnet configuration  (line:85)

2) Run '.scripts/FirstDeploy.sh rsk_testnet'



You can use truffle to build the project.

Use `npm install` to install  dependencies.

## SmartContract deployment environment variables:

The FirstDeploy.sh script exports some environment variables from the scripts/variables.sh file, those
variables are used by the truffle deploy script to configure the smart-contracts parameters.

The following variables are lists of strings separated by semicolons, they all must have the same length and each 
position of the list corresponds to the parameters of the coinPairPrice smart contract for the CurrencyPair 
that shares the same location.
 
- CurrencyPair: "BTCUSD;RIFBTC"
  The list of currency pairs to deploy
  
- maxOraclesPerRound: "10;10"
  The maximum oracles that must participate in each round (from those that have the more stake)
  
- bootstrapPrice: "1000000000000000:1000000000000000"
  The initial value of the price 
  
- numIdleRounds: "2;2"
  The number of rounds an oracle must be idle before it can be removed and the owner be able to recover his stake.

- roundLockPeriodInBlocks: "86400:86400"
  The round length in blocks (1 month).

- validPricePeriodInBlocks: "180:180"
  The valid price period blocks (1 hour).
        
The following are configurations parameters for the OracleManager smart contract.        

- minOracleOwnerStake: "10000000000" 
  This is the minimum amount of MOCs that an oracle owner must stake.  
  
The following are configurations parameters for the Supporters smart contract.        

- supportersEarnPeriodInBlocks: 10
  The supporters round length in block.
  
- supportersMinStayBlocks: 10
  The minimum amount of blocks a supporter must stay after staking before he can stop the operating.
  
- supportersMinStopBlocks: 10
  The minimum amount of blocks a supporter must stay stop before he can recover his stake.

## Tests

```
npm run test
```

## Coverage Tests

```
npm run coverage
```


## Helper scripts
In the scripts directory there are some useful helpers scripts that can be used to gather information
form a deployment and to manage the gobernanza system.

### deploy

- FirstDeploy.sh: this script does the deploy of the smart contracts using truffle deploy internally.

- variables.sh, variables_test.sh: Used as configuration for the FirstDeploy.sh script


### general
- give_coinbase_to_test_servers.js: Send coin base (rbtc) to the list of oracles declared in TEST_SERVERS.js
    Example ```truffle exec --network development scripts/give_coinbase_to_test_servers.js```

- register_test_servers.js: Register the oracles listed in TEST_SERVERS.js 

- info.js: Get information about the Supporters and Oracles registered directly from the block chain
    The information is similar to the one given by the UI.

- TEST_SERVERS.js: In this file we declare the test servers that are used by the give_coinbase_to_test_servers 
    and register_test_servers scripts.

- helpers.js: common code used by all helper scripts

### gobernanza
- get_code.js: get the code of a smart-contract, used to check if some implementation has changed.
    Example ```truffle exec --network development scripts/get_code.js some_contract_addr```
 
- change_execute.js: execute a change smart contract deployed in some address using a governor. It
    takes the governor address and change contract address as arguments.
    Example ```truffle exec --network development scripts/change_execute.js gobernor_addr change_contract_addr```

- change_implementation_by_gobernanza.js: execute a change contract (UpgraderTemplate) to change the implementation
    of one of the upgradeable contracts. The upgradeable contracts share the same proxy_address but different implementations.
    Example ```truffle exec --network development scripts/change_implementation_by_gobernanza.js upgrade_delegator_addr proxy_addr new_implementation_addr```

- change_max_oracles_per_round_by_gobernanza.js: using a change contract (CoinPairPriceMaxOraclesPerRoundChange) change the
    maximum number of oracles per round of a CoinPairPrice contract.
    Example ```truffle exec --network development scripts/change_max_oracles_per_round_by_gobernanza.js coin_pair_price_smart_contract_addr new_val```

- change_round_lock_period_in_blocks_by_gobernanza.js: using a change contract (CoinPairPriceRoundLockPeriodInBlocksChange) change the
    round lock period in blocks a CoinPairPrice contract.
    Example ```truffle exec --network development scripts/change_round_lock_period_in_blocks_by_gobernanza.js coin_pair_price_smart_contract_addr new_val```

- change_supporters_period_gobernanza.js: using a change contract (SupportersWhitelistedPeriodChange) change the
    supporters round period in blocks of the SupportersWhitelisted contract (currently deployed, in the build directory).
    Example ```truffle exec --network development scripts/change_supporters_period_gobernanza.js new_val```
  
- deploy_coinpairprice_upgrade.js: Deploys a new implementation of CoinPairPrice smart contract. After that the
    change_implementation_by_gobernanza.js must be executed to upgrade the smart contract proxy.

- change_helpers.js: common code used by the rest of the helper scripts. 

