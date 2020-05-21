# Oracle price feeder reference implementation

## Requirements 

The server uses Python >=3.7. Run the following command to install the needed packages:

```
sudo apt-get install python3 python-dev python3-dev \
     build-essential libssl-dev libffi-dev \
     libxml2-dev libxslt1-dev zlib1g-dev \
     python3.7-dev \
     python-pip
```


## Installation
- Clone the Oracle repository.

- Go to the `server` directory inside the repo.

- Create a python virtualenv: 

      virtualenv -p python3.7 venv

- Activate the virtual environment:
    -  source venv/bin/activate
    
- Install the required python libraries:
    - pip install -r requirements.txt
    
- Build the contracts following the instructions on [contracts/README.md](../contracts/README.md)

- Configure the server by renaming the `dotenv_example` file to `.env`:
    - mv dotenv_example .env
    
- Edit the `.env` configuration file with a text editor and set the server parameters accordingly.
For more details see [Server Configuration](#server-configuration).

    - For this step you need an address (with the corresponding private key) and rsk funds in order 
    to deploy the oracle. This address/key is used to publish prices in the blockchain. 
    - Open .env: 
        - And set the followin parameters
        
        `NODE_URL = "https://public-node.testnet.rsk.co:443"`

        `CHAIN_ID=31`

        `ORACLE_PRIVATE_KEY="Your private key 0x..."`
        
    - Optionally configure the server signing port:

        `ORACLE_PORT=5556`

        Even though default configuration is 5556 you can choose any port you like as this is flexible.

- Start the oracle: 

```
./run_oracle.sh
```

- Register the Oracle and subscribe to the desired coin pairs using the web application (dapp)



# Server Configuration
The server needs three kind of configuration values
1. The server configuration parameters. Those are taken from the environment or set in a `.env` file. 
2. The address of the registry contract.
3. The contracts abi (Application Binary Interface)

The server configuration parameters are used to connect to the blockchain. After connecting to the 
blockchain, using the contracts abi and the address of the registry contract the server
get the rest of the configuration directly from the blockchain registry. This way all the Oracles
use the same parameter values.


### Contracts abi and address of the registry contract
The server expect to find the contracts abi inside the json files generated during the 
deployment process. Those files are stored in the directory `contract/build` (CONTRACT_FOLDER). Those 
files also include the contract addresses. This information is used to call the contracts. Specifically 
it is used to call the blockchain registry contract that stores the rest of the parameters.
The only mandatory parameters are the ones used to connect to the blockchain and are described bellow.

### Server configuration parameters
Except for the variables needed to connect to the block chain and the private key, the rest
of the parameters are optional. The server starts with reasonable defaults and then gets the 
parameters from the blockchain. 
 
An example of the minimal set of variables can be found in `dotenv_example` file. 
Those variables are:
- NODE_URL: The url used to access the block chain node.
- CHAIN_ID: Needed if the blockchain doesn't support the eth_chainId rpc call.
- ORACLE_PRIVATE_KEY: This is the private key of the account used to publish prices.

The rest of the parameters are optional. If they are missing they are taken from the registry smart contract.

- DEVELOP_NETWORK_ID = 12341234 
    
    This parameter is needed only if the contract were deployed to more then one network. In this
    case the json file contains more than one address and to choose the right one the 
    `DEVELOP_NETWORK_ID` is used.  
    
- CONTRACT_FOLDER = "../build/contracts"

    This parameter contains the path to the contract folder.
    
- WEB3_TIMEOUT = "30 secs" 
    
    This is the timeout used when connecting to the blockchain node.

- SCHEDULER_POOL_DELAY = "10 secs"

    Delay in which the supporters scheduler checks for round change conditions and try to execute a 
    distribute transaction.

- SCHEDULER_ROUND_DELAY = "1 days"
    
    Delay in which the supporters scheduler checks for round change after a round was successfully closed.
    
- SCHEDULER_RUN_ORACLE_SCHEDULER = True

    This parameter can be used to disable the Oracle scheduler.

- SCHEDULER_RUN_SUPPORTERS_SCHEDULER = True     
        
    This parameter can be used to disable the Supporters scheduler.

- ORACLE_RUN = True
    
    This parameter can be used to disable the Oracle. The server still runs the schedulers.

- ORACLE_PORT = 5556

    Port in which the oracle listen for sign request.

- ORACLE_MONITOR_RUN = False

    This can be used to enable/disable the internal monitor. The monitor is a module that store information 
    in log files.

- ORACLE_MAIN_LOOP_TASK_INTERVAL = "120 secs"

    This is the delay in which the Oracle check for coin pairs in the OracleManager smart contract.
    The main loop maintains a list of coin pairs for which the price must be published. For each
    coin pair there are tasks to get the price from the exchanges and to publish to the blockchain. 

- ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = "3 secs"

    Per coin pair loop scanning interval. Every ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL we check for the
    right conditions to publish a price, then we try to get the signature and send the transaction to
    the blockchain.

- ORACLE_BLOCKCHAIN_INFO_INTERVAL = "3 secs"

    Interval in which we collect information from the blockchain. Things like last publication block, current
    block number, etc.

- ORACLE_PRICE_FETCH_RATE = "5 secs"

    Interval in which we check exchanges price. All the exchanges are queried at the same time in parallel.

- ORACLE_PRICE_REJECT_DELTA_PCT = 50

    When an Oracle ask for a signature if the price difference percentage is grater than this value
    we reject the request by not signing.
    
- ORACLE_PRICE_FALLBACK_DELTA_PCT = 0.05
    
    To decide when to publish the Oracle check for the price difference percentage between the currently
    published price in the blockchain and the last price from the exchanges. It the change is more than
    `ORACLE_PRICE_FALLBACK_DELTA_PCT` the Oracle starts to count blocks. After `ORACLE_PRICE_PUBLISH_BLOCKS`
    the selected Oracle try to publish and after `ORACLE_PRICE_FALLBACK_BLOCKS` the first fallback Oracle
    try to publish, after `ORACLE_PRICE_FALLBACK_BLOCKS + 1` the second fallback Oracle try to publish, etc.

- ORACLE_PRICE_PUBLISH_BLOCKS = 1

    The selected oracle publishes after `ORACLE_PRICE_PUBLISH_BLOCKS` blocks after a price change.

- ORACLE_PRICE_FALLBACK_BLOCKS = 3

    The fallback oracle try to publish `ORACLE_PRICE_FALLBACK_BLOCKS` blocks after a price change.

- ORACLE_GATHER_SIGNATURE_TIMEOUT = "60 secs"

    Timeout used when requesting signatures fom other oracles.

- ORACLE_STAKE_LIMIT_MULTIPLICATOR = 2

    This parameter is used to limit the difference in participation between the Oracles. The maximum
    stake taken into consideration to choose the selected Oracle is the minimum stake multiplied by 
    this factor (even if some oracle has more stake).

- ORACLE_COIN_PAIR_FILTER =[ "BTCUSD", "RIFUSD" ]

    This can be used to limit the coin pairs that the Oracle monitors. The missing coin pairs are ignored
    even if the Oracle is subscribed to them. **An empty value `[]`) means: to monitor all coin pairs**.

#### Server configuration: parameters for development 

- DEBUG = False

    Turn on debug logging.

- UVICOIN_DEBUG = False
    
    Turn on web server debug logging. Log requests, etc.
    
- LOG_LEVEL = "info"

    Default log level.
    
    
- DEBUG_ENDPOINTS = False

    Add a swagger interface for the endpoints.

- RELOAD = False
    
    Reload the server automatically on a source code change.
    
- ON_ERROR_PRINT_STACK_TRACE = False

    Print the stack trace of the errors.


       
#### Server configuration: Full example
```
# Ganache cli
# NODE_URL="http://localhost:8545"
# CHAIN_ID=1

# RSK testnet
NODE_URL="https://public-node.testnet.rsk.co:443"
CHAIN_ID=31

# RSK regtest
#NODE_URL = "http://localhost:4444"
#CHAIN_ID=33 (NEEDED IF THE SERVER DOESN'T SUPPORT GET_CHAIN_ID RPC CALL)
#DEVELOP_NETWORK_ID=33 (OPTIONAL)

# RSK testnet CoinFabrik
# NODE_URL = "http://rsknodes:4446"
# CHAIN_ID=31 (NEEDED IF THE SERVER DOESN'T SUPPORT GET_CHAIN_ID RPC CALL)
# DEVELOP_NETWORK_ID=31 (OPTIONAL)

# RSK testnet
# NODE_URL = "https://public-node.testnet.rsk.co:443"
# CHAIN_ID=31 (NEEDED IF THE SERVER DOESN'T SUPPORT GET_CHAIN_ID RPC CALL)
# DEVELOP_NETWORK_ID=31 (OPTIONAL)

# The server expect to find in this folder the *.json files with the abi an addresses of contracts
# CONTRACT_FOLDER = "../build/contracts"

# Timeout used when connection to the blockchain node
# WEB3_TIMEOUT = "30 secs"

############################################### SCHEDULER

# Delay in which the scheduler checks for round change conditions
# SCHEDULER_POOL_DELAY = "10 secs"
# Delay in which the scheduler checks for round change after a round was closed
# SCHEDULER_ROUND_DELAY = "1 days"
# Run the oracle round scheduler?
# SCHEDULER_RUN_ORACLE_SCHEDULER = True
# Run the supporters round scheduler?
# SCHEDULER_RUN_SUPPORTERS_SCHEDULER = True


############################################### ORACLE
# Run the oracle server (sign api and publisher).
ORACLE_RUN = True

# Port in which the oracle listen for sign request
ORACLE_PORT = 5556

# Flag that indicates if the monitor (a module that store information in logfiles) must be run
ORACLE_MONITOR_RUN = False

# Oracle-only parameters.
# Account used to publish prices
ORACLE_ADDR="0x..."
ORACLE_PRIVATE_KEY="0x..."

# Main Oracle loop scanning interval, in which we get the coinpair list
ORACLE_MAIN_LOOP_TASK_INTERVAL = "120 secs"

# Per coin pair loop scanning interval, in which we try to publish
ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = "3 secs"

# This loop collect a lot of information needed for validation (like last pub block) from the block chain
ORACLE_BLOCKCHAIN_INFO_INTERVAL = "3 secs"

# Exchange price- etch rate in seconds, all the exchanges are queried at the same time.
ORACLE_PRICE_FETCH_RATE = "5 secs"

# If the price delta percentage is grater than this we reject by not signing
ORACLE_PRICE_REJECT_DELTA_PCT = 50

# If the price delta percentage has changed and more than ORACLE_PRICE_FALLBACK_BLOCKS pass we act as fallbacks.
ORACLE_PRICE_FALLBACK_DELTA_PCT = 0.05

# Selected oracle publishes after ORACLE_PRICE_PUBLISH_BLOCKS  blocks of a price change.
ORACLE_PRICE_PUBLISH_BLOCKS = 1

# Fallback oracle try to publish ORACLE_PRICE_FALLBACK_BLOCKS blocks after price change.
ORACLE_PRICE_FALLBACK_BLOCKS = 3

# Timeout used when requesting signatures fom other oracles
ORACLE_GATHER_SIGNATURE_TIMEOUT = "60 secs"

# This is used to limit the difference in participation between selected oracles, the maximum stake used
# is the minimum multiplied by this factor (even if some oracle has more stake participating)
ORACLE_STAKE_LIMIT_MULTIPLICATOR = 2

# If configured (json array of strings) only publish for those coinpairs in the list
ORACLE_COIN_PAIR_FILTER =[ "BTCUSD", "RIFUSD" ]



############################################### ONLY FOR DEVELOPMENT

# Turn on debug?
# DEBUG = False
# UVICOIN_DEBUG = False
# LOG_LEVEL = "info"
# Add some development endpoints
# DEBUG_ENDPOINTS = False
# Reload on source code change, used for development
# RELOAD = False
# Print stack trace of errors, used for development
# ON_ERROR_PRINT_STACK_TRACE = False
```

