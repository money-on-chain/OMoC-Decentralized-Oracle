MoC Contracts
=============

Requirments:
===========
npm install -g ganache-cli
node version 10.17.0
npm install

how to deploy the SmartContract:
===============================

A.Ganache:
----------
1) npm install -g ganache-cli
2) Run './run_ganache.sh'
3) In another tab run './scripts/FirstDeploy.sh'


B.RSKTestnet:
-------------

1) Edit truffle-config.js at rsk_testnet configuration  (line:85)

2) Run '.scripts/FirstDeploy.sh rsk_testnet'



You can use truffle to build the project.

Use `npm install` to install  dependencies.

SmartContract deployment environment variables:
===============================================

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

 

Coverage Tests
==============

```
npx truffle run coverage --network ganache_test --file="test/Oracle.js 
```


