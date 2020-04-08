'use strict';
global.artifacts = artifacts;
global.web3 = web3;
const helpers = require("./helpers");

async function oracleInfo(oracleManager) {
    const coinCant = await oracleManager.getCoinPairCount();
    for (let i = 0; i < coinCant; i++) {
        const coinPair = await oracleManager.getCoinPairAtIndex(i);
        for (const addr of await helpers.getAllOracles(oracleManager)) {
            const {
                points,
                selectedInRound,
                selectedInCurrentRound,
            } = await oracleManager.getOracleRoundInfo(addr, coinPair);
            const isSubscribed = await oracleManager.isSuscribed(addr, coinPair);
            const ret = await oracleManager.getOracleRegistrationInfo(addr);
            const {
                internetName,
                stake,
            } = ret;
            const owner = ret[2];
            console.log(helpers.coinPairStr(coinPair), " -> ORACLE INFO FOR: ", addr, " IS ", {
                internetName,
                points,
                stake,
                selectedInCurrentRound,
                selectedInRound, isSubscribed, owner
            });
        }
    }
}

async function supportersInfo(oracle, oracleAddr, supporters) {
    const addr = oracleAddr;
    for (const subaccount of await helpers.getAllOracles(oracle)) {
        console.log("addr", addr, "subaccount", subaccount);
        const balance = await supporters.getBalance(addr);
        const balanceAt = await supporters.getBalanceAt(addr, subaccount);
        console.log("   token balance:", balance.toString(), "balanceAt", balanceAt.toString());
        const mocBalance = await supporters.getMOCBalance(addr);
        const mocBalanceAt = await supporters.getBalanceAt(addr, subaccount);
        console.log("   moc balance:", mocBalance.toString(), "balanceAt", mocBalanceAt.toString());
    }
}


async function principal(conf) {
    if (true) {
        console.log("-".repeat(80), "ORACLES");
        await helpers.printProps("---> PROPS OF oracleManager", conf.oracleManager);
        const cprMethods = conf.oracleManager.contract;
        const coinCant = await cprMethods.getCoinPairCount();
        for (let i = 0; i < coinCant; i++) {
            const coinPair = await cprMethods.getCoinPairAtIndex(i);
            const addr = await cprMethods.getContractAddress(coinPair);
            const contract = await artifacts.require("CoinPairPrice").at(addr);
            conf.coinPairPrice = {
                addr: contract.address,
                abi: contract.abi,
                contract,
            };
            await helpers.printProps("PROPS " + helpers.coinPairStr(coinPair) + " -> " + addr, conf.coinPairPrice);
        }
        await oracleInfo(conf.oracleManager.contract);
    }
    if (true) {
        console.log("-".repeat(80), "SUPPORTERS");
        await helpers.printProps("---> PROPS OF supporters", conf.supporters);
        await supportersInfo(conf.oracleManager.contract, conf.oracleManager.addr, conf.supporters.contract);
    }
}

async function main() {

    const CONTRACTS = {
        oracleManager: "OracleManager",
        token: "TestMOC",
        supporters: "SupportersWhitelisted",
    };

    const conf = {}
    for (const x of Object.keys(CONTRACTS)) {
        const contract = await artifacts.require(CONTRACTS[x]).deployed();
        conf[x] = {
            addr: contract.address,
            abi: contract.abi,
            contract,
        }
    }
    await principal(conf);
}

// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};

