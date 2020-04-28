#Configuration to setup MOC-Decentralized-Oracle for rsk_testnet




##Contrats (../contracts/build/contracts/*.json )
In view of running everything in rsk_testnet it is a requirement to have the .json files of the contract in the folder: OMoc.../contracts/build/contracts . For this we have two options, the first is to do a new deploy of the contracts (we do this with ./scripts/FirstDeploy.sh rsk_testnet) or access the contracts that are already deployed (you cand download those frome this link).

These *.json files will be used by oracle's server.
##Oracul's server
In order setup and run an oracle we need to run the ./run_oracle.sh script inside the ./server folder. 
As a previous step, we need to configure the environment variables in the .env file (if it does not exist, we run "cp dotenv_example .env"). Remember that in such a file you must configure the network to connect, the scheduler_signing addr and privkey as well as Oracle addr and privKey. Then we modify ORACLE_COIN_PAIR_FILTER if we intend to be subscribed to a single CoinPair.


##Dapp
Right now we have the dapp running at http://167.172.106.249/.	
If you want to run your own dapp with your own contract deployed at folder: ../contracts/build/contracts/

first run the following commands:

```
cd ./dapp

echo "" > .env
echo "REACT_APP_AllowMint=true" >>.env
echo "REACT_APP_NetworkID=31" >> .env
echo "REACT_APP_RefreshTime=1000" >> .env

node tools/json2env.js >> .env

```

Then you can run `npm start` or `npm build`  if you are setting a server