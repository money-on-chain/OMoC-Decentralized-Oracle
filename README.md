# MONEY ON CHAIN
**Descentralized Oracle System**
Proof-Of-Concept.
Revision 1.0


#### Document Revisions
Rev 1.0.        First revision.         Jan 7, 2020.

Overview
========

This repository contains the POC-stage source code for the Money On Chain
Descentralized Oracle system. The included components are:

* Solidity contract with interfaces to register and approve oracles, start and close rounds, and publish price information on-chain by approved oracles.

* Reference oracle implementation with the ability to query prices from  remote sources, determine the next price publisher, co-sign price publication messages, and call the smart contract interface to publish a new price.

* Scheduler implementation that triggers rounds for oracles to work. 

Project Structure
=================

```
contracts               The source code of the Solidity contract, including a test MOC token.
servers\oracle          The reference Oracle implementation.
servers\scheduler       The scheduler implementation.
servers\scripts         A set of scripts to test and evaluate system operation.
dapp                    
```

Requirements
============

* Linux / macOS system.  Windows is not supported.
* Python >= 3.7 
* NodeJS >= 10.17.0

You may want to setup a virtual environment for Python using `virtualenv` or similar package.

How-To
======

The system can be operated under Ethereum or RSK **testing** networks. The Ethereum community offers Ganache and ganache-cli as fast testing environment. In this document we'll show ganache-cli, the command line interface;  the version with graphical UI can be used in the same manner.

The Truffle framework is also needed for effortless compilation and deployment of the smart contracts.

Truffle installation
--------------------
Install the Truffle framework by issuing:

```
npm install -g truffle
```

Under the `contracts` folder, where `package.json` resides do a `npm install` to install necessary dependencies for this project compilation and deployment activities.

Truffle must acknowledge in which network the contracts will be deployed. The relevant information is found in `truffle-config.js` under `networks` section. Each network entry name can be used later in the deployment stage.

Read the *section below* as running in the RSK testnet is quite similar.

Running under Ethereum/Ganache
------------------------------

Install `ganache-cli` through npm:

```
npm install -g ganache-cli
```

The first step is to compile the smart contract code. Go to the `contracts` folder and execute the following command:

```
truffle compile
```

The compilation output should be similar, if successful, to the following:

```
Compiling your contracts...
===========================
> Compiling ./contracts/Context.sol
> Compiling ./contracts/ERC20.sol
> Compiling ./contracts/IERC20.sol
> Compiling ./contracts/Migrations.sol 
> Compiling ./contracts/Oracle.sol
> Compiling ./contracts/SafeMath.sol
> Compiling ./contracts/TestMOC.sol

    > compilation warnings encountered:

/home/hernandp/src/mOcRACLE/contracts/contracts/Oracle.sol:2:1: Warning: Experimental features are turned on. Do not use experimental features on live deployments.
pragma experimental ABIEncoderV2;
^-------------------------------^

> Artifacts written to /home/hernandp/src/mOcRACLE/contracts/build/contracts
> Compiled successfully using:
   - solc: 0.5.16+commit.9c3226ce.Emscripten.clang

```

The compilation result is a set of JSON files in the `build` subdirectory containing the ABI for calling the contract, network information, etc. 

Execute the `ganache-cli` testing environment. For this example we will run with a network ID of 12341234 and a fixed set of addresses which is generated automatically by the -d (_deterministic_) parameter, as follows:

```
ganache-cli -d -i 12341234
```

Ganache will listen from the 127.0.0.1 loopback address at port 8545.

### Deploying contracts

Under the `contracts` directory, execute _truffle_ with the following parameters to deploy the contracts you compiled to the `ganache-cli` blockchain:

```
truffle deploy --network ganache_localhost
```

If deployment is successful, the command will yield a similar output to:

```
Summary
=======
> Total deployments:   3
> Final cost:          0.10001312 ETH

```

### Python dependencies installation

Under the `servers` directory you must install the required Python module dependencies that are listed in the requirements.txt file. Remember that a virtual-environment solution such as _virtualenv_ is required. Under your Python environment, execute:

```
pip install -r requirements.txt
``` 


## Running the Netsim script

The Netsim script allows to run a simulation of the decentralized oracle system where a defined set of oracles publish prices on the testing environment. This way fundamental functionality such as round open, close, publisher selection and reward distribution can be quickly verified.

### Configuration through .env file

Servers must be configured accordingly in a `.env` file. We supply a `dotenv_example` file under the `servers` folder as a starting version; check NODE_URL and NETWORK_ID entries to match the `ganache-cli` settings, or of any node your are running:

```
# ganache cli
NODE_URL = "http://localhost:8545"
NETWORK_ID=12341234
CHAIN_ID=1
```

Note that the default Netsim script will use the following addresses for the oracles:

```
0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d
```

While the contract owner at deployment will be set to the address: 

```
0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

Make sure the following entries are set in the `.env` file:

```
SCHEDULER_SIGNING_ADDR="0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"
SCHEDULER_SIGNING_KEY="6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"
SCHEDULER_POOL_DELAY="10 secs"
SCHEDULER_ROUND_DELAY="60 secs"
SCHEDULER_REWARD_BAG_ADDR="0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826"
PRICE_FETCHER_OWNER_ADDR="0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
PRICE_FETCHER_OWNER_KEY="4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
REWARD_BAG_KEY="c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4"
``` 

### Execution of the netsim script

Make sure you are at the `servers` directory and ganache-cli is running, execute the follow, preferably in a new window to monitor progress:

```
python -m scripts.netsim
```

The startup will show you configuration settings along with three (by default) oracles that will begin to fetch prices; the scheduler will wait for conditions to open a round. 

Keep in mind that in this version rewards are distributed from a source address which must be feed with MOCs. To do this, execute the add_rewards scripts as follows:

```
python -m scripts.add_rewards
```

To start the initial round as an administrator would do, execute from the same `servers` directory:

```
python -m scripts.start_initial_round
```

The scheduler will call the smart contract interface to trigger the opening of the first round, so the oracles can publish prices.

Use the list_oracles script to verify how many points each oracle has gained in the current round:

```
python -m scripts.list_oracles

 INFO FOR  0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d  : 
 {'internetName': 'http://127.0.0.1:24004', 
 'points': 0, 'ownerStake': 14000000000000000000, 'approve': True}
 
 INFO FOR  0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b  :  
 {'internetName': 'http://127.0.0.1:24002', '
 points': 1, 'ownerStake': 8000000000000000000, 'approve': True}
 
 INFO FOR  0x28a8746e75304c0780E011BEd21C72cD78cd535E  :  
 {'internetName': 'http://127.0.0.1:24000', 
 'points': 0, 'ownerStake': 2000000000000000000, 'approve': True}
``` 


