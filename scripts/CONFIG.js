// Use dotenv file
const path = require('path');
const rootDir = path.resolve(process.cwd());
const helpers = require('./helpers');
const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
require('dotenv').config({path: path.resolve(rootDir, '.env')});

const CONTRACTS = {
    oracleManager: "OracleManager.json",
    coinPairPrice: "CoinPairPrice.json",
    token: "TestMOC.json",
    supporters: "SupportersWhitelisted.json",
};

const configurations = {
    ganache: (contract) => configGanache(contract),
    rsknode_gobernanza: (contract) => configRsk(contract, "build_gobernanza", "http://rsknodes:4446"),
    rsknode_build: (contract) => configRsk(contract, "build", "http://rsknodes:4446"),
    rskpublic_gobernanza: (contract) => configRsk(contract, "build_gobernanza", "https://public-node.testnet.rsk.co"),
    rskpublic_build: (contract) => configRsk(contract, "build", "https://public-node.testnet.rsk.co"),
}
if (!process.env.NETWORK || !configurations[process.env.NETWORK.toLowerCase()]) {
    console.error("configure the NETWORK environment variable:", Object.keys(configurations));
    process.exit();
}
console.log("Using conf", process.env.NETWORK);
const CONFIG = configurations[process.env.NETWORK];


function configRsk(contracts, buildPath, url) {
    console.log("USING RSK TESTNET", url, " contracts from ", buildPath);
    const w = new HDWalletProvider(["3b7fe967dfa11684539ceb1f3c8606aa5af6915bd1d31f32f7f8a59757dcc8a5"], url);
    const web3 = new Web3(w.engine)
    const jsonPath = path.join(__dirname, buildPath, 'contracts');
    const contractData = helpers.getContractData(jsonPath, contracts);
    const addresses = Object
        .keys(contracts)
        .reduce((acc, x) => {
            const data = contractData[x].data;
            acc[x] = data.networks[31] ? data.networks[31].address : undefined;
            return acc;
        }, {});
    return {
        web3: {...web3, done: () => w.engine.stop()},
        ...helpers.getContracts(web3, contractData, addresses),
    };
}

module.exports.configRsk = configRsk;

function configGanache(contracts) {
    console.log("USING GANACHE");
    const url = "http://localhost:8545";
    const web3 = new Web3(url);
    const jsonPath = path.join(__dirname, "..", "contracts", "build", "contracts");
    const contractData = helpers.getContractData(jsonPath, contracts);
    const addresses = Object
        .keys(contracts)
        .reduce((acc, x) => {
            const data = contractData[x].data;
            acc[x] = data.networks[12341234] ? data.networks[12341234].address : undefined;
            return acc;
        }, {});
    return {
        web3: {...web3, done: () => console.log("DONE")},
        ...helpers.getContracts(web3, contractData, addresses)
    };
}

module.exports.configGanache = configGanache;


function run(principal, contracts = CONTRACTS) {

    async function main() {
        const conf = CONFIG(contracts);
        try {
            await principal(conf);
        } finally {
            console.log("Shutting down web3...")
            conf.web3.done();
        }
    }

    main().catch(console.error);
}

module.exports.run = run;
