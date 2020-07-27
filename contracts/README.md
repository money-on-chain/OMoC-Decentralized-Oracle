# MoC Oracle Contracts

This project holds the MOC Oracles smart contracts. 

We use [truffle](https://www.trufflesuite.com/) to develop and deploy the smart contracts
to the blockchain.

The truffle migration scripts need some parameters 
(see: [env vars](#smart-contract-deployment-environment-variables)) that must be 
configured using environment variables. Optionally a dotenv `.env` file can be used to 
set those parameters. 

Truffle uses a configuration file called truffle-config.js and we use the HDWalletProvider to
configure the private key used to send transactions. 
Add an entry to the networks section describing your blockhain node endpoint and specific parameters. 

For example:

```
 my_blockchain_conf: {
            provider: () => {
                return new HDWalletProvider([process.env.PRIVATE_KEY], "https://public-node.testnet.rsk.co");
            },
            gasPrice: 59240000,
            gas: GAS_LIMIT,
        },
```  
 
 
## Requirements:

```
node version 10
```

## How to build the contracts to be used on other projects (DAPP & Server):

```bash
 $ cd contracts/
 $ npm install
 $ npx truffle compile --all
```

## How to deploy the SmartContract:

```bash
 $ cd contracts/
 $ npm install
 $ npx truffle migrate --network my_blockchain_conf --reset
```
After the deployment the contacts abis are saved in the `build` directory
and addresses are stored in the `.openzeppelin` dir. Backup both directories and
save the information in a safe place, if you loose the addresses you cannot access
anymore the deployed contracts.

## First Deploy helper script 

For a testnet it is easyer to use the `./scripts/FirstDeploy.sh` bash script that 
set the configuration environment variables, does a cleanup and saves all the necessary files 
at the end of the deployment so they can be distributed.  


### Using Ganache:

1) npm install -g ganache-cli
2) Run './run_ganache.sh'
3) In another tab run './scripts/FirstDeploy.sh'

### Using RSK-Testnet:

1) Edit truffle-config.js at rsk_testnet configuration
2) Run '.scripts/FirstDeploy.sh rsk_testnet'


## Smart Contract Deployment Environment Variables:

The FirstDeploy.sh script exports some environment variables from the scripts/variables.sh file, truffle 
deploy script uses those variables to configure the smart-contracts parameters.
The same variables can be set using dotenv (copy or rename the env_example file to .env and configure it).

- PRIVATE_KEY: This is the private key used to deploy the contract. The key is also use as the
owner of the governor that is the address that can change the system by gobernanza. 

- The following variables are lists of strings separated by semicolons, they all must have the same length and each 
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
    
- The following are configurations parameters for the OracleManager smart contract.        
    
    - minOracleOwnerStake: "10000000000" 
      This is the minimum amount of MOCs that an oracle owner must stake.  
      
- The following are configurations parameters for the Supporters smart contract.        
    
    - supportersEarnPeriodInBlocks: 10
      The supporters round length in block.
      
    - supportersMinStayBlocks: 10
      The minimum amount of blocks a supporter must stay after a stop to be able to withdraw.
      
    - supportersAfterStopBlocks: 10
      The period of blocks that you have after a stop and staying minStayBlock to do withdraw.
  

## Truffle Tests

```
npm run test
```

## Coverage Tests

```
npm run coverage
```


## Helper scripts

In the `scripts` directory there are some useful helpers scripts that can be used to gather information
form a deployment and to manage the gobernanza system.

### deploy

- FirstDeploy.sh: this script does the deploy of the smart contracts using truffle migrate internally.

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

### Truffle scripts

- get_code.js: get the code of a smart-contract, used to check if some implementation has changed.
    
    ```truffle exec --network development scripts/get_code.js some_contract_addr```
 
- change_execute.js: execute a change smart contract deployed in some address using a governor. It
    takes the governor address and change contract address as arguments.
    
    ```truffle exec --network development scripts/change_execute.js gobernor_addr change_contract_addr```

- change_implementation.js: execute a change contract (UpgraderTemplate) to change the implementation
    of one of the upgradeable contracts. The upgradeable contracts share the same proxy_address but different implementations.
    
    ```truffle exec --network development scripts/change_implementation.js upgrade_delegator_addr proxy_addr new_implementation_addr```

- change_run.js: run a change contract using the deployed governor
    
    ```truffle exec --network development scripts/change_run.js change_contract_name change_contract_args... ```

- change_run_in_coinpair.js: run a change contract for a specific coin pair using the deployed governor.
    
    ```truffle exec --network development scripts/change_run_in_coinpair.js coin_pair_name change_contract_name change_contract_args... ```

- change_delegate_governor.js: change the governor in all the governable smart-contarcts of the system using
    the current deployed governor.
    
    WARNING: after this step you loose the control over the system!!!
     
    ```truffle exec --network development scripts/change_delegate_governor.js new_governor_address ```

- deploy_coinpairprice_upgrade.js: Deploys a new implementation of CoinPairPrice smart contract. After that the
    change_implementation.js must be executed to upgrade the smart contract proxy.
