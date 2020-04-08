const config = require('./CONFIG.js');
const helpers = require('./helpers');
const colors = require('colors/safe');

const CONFIG = config.configRsk;

const CONTRACTS = {
    governor: "Governor.json",
    upgradeDelegator: "UpgradeDelegator.json",
    iozProxyAdmin: "IOZProxyAdmin.json",
    token: "TestMOC.json",

    oracleManager: "OracleManager.json",
    coinPairPrice: "CoinPairPrice.json",
    coinPairPriceFree: "CoinPairPriceFree.json",

    supportersWhitelisted: "SupportersWhitelisted.json",
    supportersVested: "SupportersVested.json",
};

async function call(contract, method, args = []) {
    const m = contract.contract.methods;
    return await m[method](...args).call();
}

function okWrong(bool) {
    return bool ? colors.green("OK") : colors.red("WRONG");
}

function printAddr(conf, addr) {
    console.log(addr + " address: ", conf[addr].addr, okWrong(conf[addr].addr));
    return conf[addr].addr;
}

async function printImpl(conf, contract, proxyAdminAddr) {
    const udpi = await call(conf.upgradeDelegator, "getProxyImplementation", [contract.addr]);
    console.log("\timplementation smart contract", udpi);
    const udpa = await call(conf.upgradeDelegator, "getProxyAdmin", [contract.addr]);
    console.log("\tcan be upgraded by proxyadmin", udpa, okWrong(udpa == proxyAdminAddr));

}

async function checkAttr(contract, attr, val) {
    const g = await call(contract, attr);
    console.log("\t" + attr, g, okWrong(g == val));
}

async function principal(conf) {
    const l = console.log;
    l("Checking contract dependecies...");

    if (printAddr(conf, "governor")) {
        l("\t", colors.green("SYSTEM OWNER " + await call(conf.governor, "owner")));
    }

    if (!printAddr(conf, "upgradeDelegator")) {
        console.log(colors.red("Need the upgradeDelegator address to get the proxyAddress and then verify everything"));
        return;
    }
    await checkAttr(conf.upgradeDelegator, "governor", conf.governor.addr);
    const proxyAdminAddr = await call(conf.upgradeDelegator, "proxyAdmin");
    l("\tproxyAdmin (this address can't be verified)", proxyAdminAddr);
    // This is just an interface, set the proxy admin address
    conf.iozProxyAdmin.contract.options.address = proxyAdminAddr;
    conf.iozProxyAdmin.addr = proxyAdminAddr;
    await checkAttr(conf.iozProxyAdmin, "owner", conf.upgradeDelegator.addr);
    await printImpl(conf, conf.upgradeDelegator, proxyAdminAddr);

    if (printAddr(conf, "token")) {
        await helpers.printProps("", conf.token);
    }

    if (printAddr(conf, "oracleManager")) {
        await checkAttr(conf.oracleManager, "governor", conf.governor.addr);
        await checkAttr(conf.oracleManager, "token", conf.token.addr);
        await checkAttr(conf.oracleManager, "supportersContract", conf.supportersWhitelisted.addr);
        await printImpl(conf, conf.oracleManager, proxyAdminAddr);
    }

    const cprMethods = conf.oracleManager.contract.methods;
    const coinCant = await cprMethods.getCoinPairCount().call();
    for (let i = 0; i < coinCant; i++) {
        const coinPair = await cprMethods.getCoinPairAtIndex(i).call();
        const addr = await cprMethods.getContractAddress(coinPair).call();

        l("\t", "-".repeat(20), colors.green(helpers.coinPairStr(coinPair) + " -> "), addr);
        conf.coinPairPrice.contract.options.address = addr;
        conf.coinPairPrice.addr = addr;
        if (printAddr(conf, "coinPairPrice")) {
            await checkAttr(conf.coinPairPrice, "governor", conf.governor.addr);
            await checkAttr(conf.coinPairPrice, "token", conf.token.addr);
            await checkAttr(conf.coinPairPrice, "oracleManager", conf.oracleManager.addr);
            await printImpl(conf, conf.coinPairPrice, proxyAdminAddr);
            const cppMethods = conf.coinPairPrice.contract.methods;
            for (let i = 0; i < await cppMethods.getWhiteListLen().call(); i++) {
                const caddr = await cppMethods.getWhiteListAtIndex(i).call();
                l("\t", "-".repeat(20), "contract that can get the price: ", caddr);
                conf.coinPairPriceFree.contract.options.address = caddr;
                conf.coinPairPriceFree.addr = caddr;
                await checkAttr(conf.coinPairPriceFree, "coinPairPrice", addr);
                await printImpl(conf, conf.coinPairPriceFree, proxyAdminAddr);
            }
        }
    }


    if (printAddr(conf, "supportersWhitelisted")) {
        await checkAttr(conf.supportersWhitelisted, "governor", conf.governor.addr);
        await checkAttr(conf.supportersWhitelisted, "mocToken", conf.token.addr);
        const sMethods = conf.supportersWhitelisted.contract.methods;
        const whitelisted = [];
        for (let i = 0; i < await sMethods.getWhiteListLen().call(); i++) {
            whitelisted.push(await sMethods.getWhiteListAtIndex(i).call());
        }
        const mustBe = [conf.oracleManager.addr, conf.supportersVested.addr]
        whitelisted.sort();
        const wl = JSON.stringify(whitelisted);
        mustBe.sort();
        const mb = JSON.stringify(mustBe);
        l("\tcontract that can stake: ", wl, okWrong(wl == mb));
    }
    await printImpl(conf, conf.oracleManager, proxyAdminAddr);

    if (printAddr(conf, "supportersVested")) {
        await checkAttr(conf.supportersVested, "governor", conf.governor.addr);
        await checkAttr(conf.supportersVested, "mocToken", conf.token.addr);
        await checkAttr(conf.supportersVested, "supporters", conf.supportersWhitelisted.addr);
        await printImpl(conf, conf.oracleManager, proxyAdminAddr);
    }
}


config.run(principal, CONTRACTS);
