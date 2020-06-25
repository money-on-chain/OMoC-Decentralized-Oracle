'use strict';

// Use dotenv file
const path = require('path');
const rootDir = path.resolve(process.cwd(), '..');
require('dotenv').config({path: path.resolve(rootDir, '.env')});
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const Governor = artifacts.require('../moc-gobernanza/contracts/Governance/Governor.sol');
const InfoGetter = artifacts.require('InfoGetter.sol');
const OracleManagerPairChange = artifacts.require("OracleManagerPairChange");
const CoinPairPriceFree = artifacts.require("CoinPairPriceFree");

stdout.silent(false);

async function deployWithProxies(deployer, networkName, accounts, params) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // Deployed in 30_info_getter
    const info_getter = await InfoGetter.deployed();
    const info_getter_addr = info_getter.address;
    console.log("infoGetterAddr", info_getter_addr);

    // Deployed in 20_moc_gobernanza
    const governorOwner = accounts[0];
    const governor = await Governor.deployed();
    const governorAddr = governor.address;
    console.log("governorAddr", governorAddr, 'owner', governorOwner);
    // We will use the project's proxy admin as upgradeability admin of this instance
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        network
    );
    const proxyAdminAddr = networkFile.proxyAdminAddress;
    console.log("proxyAdminAddr ", proxyAdminAddr);


    console.log("Deploying TestMOC");
    await scripts.add({contractsData: [{name: "TestMOC", alias: "TestMOC"}]});
    await scripts.push({network, txParams: {...txParams, gas: 4000000}, force: true});
    const testMOC = await scripts.create({
        methodName: 'initialize',
        methodArgs: [governorAddr],
        admin: proxyAdminAddr,
        contractAlias: "TestMOC",
        network,
        txParams
    });
    console.log("TestMOC: ", testMOC.options.address);


    console.log("Create Supporters Proxy");
    await scripts.add({contractsData: [{name: "SupportersWhitelisted", alias: "Supporters"}]});
    await scripts.push({network, txParams: {...txParams, gas: 5000000}, force: true});
    const supporters = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "Supporters",
        network,
        txParams
    });
    console.log("Supporters: ", supporters.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Create OraclesManager");
    await scripts.add({contractsData: [{name: "OracleManager", alias: "OracleManager"}]});
    // Give more gas!!!
    await scripts.push({network, txParams: {...txParams, gas: 6400000}, force: true});
    const oracleManager = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "OracleManager",
        network,
        txParams
    });
    console.log("OracleManager: ", oracleManager.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Create Supporters Vested");
    await scripts.add({contractsData: [{name: "SupportersVested", alias: "SupportersVested"}]});
    await scripts.push({network, txParams: {...txParams, gas: 5000000}, force: true});
    const supportersVested = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "SupportersVested",
        network,
        txParams
    });
    console.log("SupportersVested: ", supportersVested.options.address, 'proxyAdmin', proxyAdminAddr);


    console.log("Initialize supporters", 'governor', governorAddr);
    const scall = await artifacts.require("SupportersWhitelisted").at(supporters.options.address);
    await scall.initialize(governorAddr, [oracleManager.options.address, supportersVested.options.address],
        testMOC.options.address,
        params.supportersEarnPeriodInBlocks,
        params.supportersMinStayBlocks, params.supportersAfterStopBlocks);

    console.log("Initialize OracleManager", 'governor', governorAddr,);
    const omcall = await artifacts.require("OracleManager").at(oracleManager.options.address);
    await omcall.initialize(governorAddr, parseInt(params.minOracleOwnerStake), supporters.options.address);

    console.log("Initialize Supporters Vested", 'governor', governorAddr);
    const svcall = await artifacts.require("SupportersVested").at(supportersVested.options.address);
    await svcall.initialize(governorAddr, supporters.options.address);

    for (let i = 0; i < params.CurrencyPair.length; i++) {
        const coin = params.CurrencyPair[i];
        const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');

        await scripts.add({contractsData: [{name: "CoinPairPriceFree", alias: "CoinPairPriceFree"}]});
        await scripts.push({network, txParams});
        const coinPairPriceFree = await scripts.create({
            admin: proxyAdminAddr,
            contractAlias: "CoinPairPriceFree",
            network,
            txParams
        });
        console.log("coinPairPriceFree address: ", coinPairPriceFree.options.address, 'for coin', coinPair, 'proxyAdmin', proxyAdminAddr);

        const alias = 'CoinPairPrice_' + coin;
        await scripts.add({contractsData: [{name: "CoinPairPrice", alias: alias}]});
        // MORE GAS!!!
        await scripts.push({network, txParams: {...txParams, gas: 6000000}, force: true});
        const coinPairPrice = await scripts.create({
                admin: proxyAdminAddr,
                contractAlias: alias,
                methodName: 'initialize',
                methodArgs: [
                    governorAddr,
                    [coinPairPriceFree.options.address, info_getter_addr],
                    coinPair,
                    testMOC.options.address,
                    parseInt(params.maxOraclesPerRound[i]),
                    parseInt(params.roundLockPeriodInBlocks[i]),
                    parseInt(params.validPricePeriodInBlocks[i]),
                    params.bootstrapPrice[i],
                    parseInt(params.numIdleRounds[i]),
                    oracleManager.options.address],
                network,
                txParams
            }
        );
        console.log("coinPairPrice address: " + coinPairPrice.options.address, 'governor', governorAddr, 'proxyAdmin', proxyAdminAddr);

        console.log("Initialize coinpair price free for", coin);
        const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.options.address);
        await cpfcall.initialize(coinPairPrice.options.address);

        console.log("Register coin", coin, 'via governor', governorAddr);
        const change = await OracleManagerPairChange.new(oracleManager.options.address, coinPair, coinPairPrice.options.address);
        console.log("Register coin via governor", governorAddr, 'coin', coin, "change contract addr", change.address, 'governor owner', governorOwner);
        await governor.executeChange(change.address, {from: governorOwner});
    }
}

async function config(deployer, networkName, accounts) {
    if (!process.env.CurrencyPair) {
        console.error("The script must be configured with .env file, see dotenv_example");
        throw new Error()
    }

    function parseEnvArray(str) {
        return str.split(";").map(x => x.trim()).filter(x => x.length != 0);
    }

    //import variables
    const params = {
        CurrencyPair: parseEnvArray(process.env.CurrencyPair),
        minOracleOwnerStake: parseEnvArray(process.env.minOracleOwnerStake),
        maxOraclesPerRound: parseEnvArray(process.env.maxOraclesPerRound),
        bootstrapPrice: parseEnvArray(process.env.bootstrapPrice),
        numIdleRounds: parseEnvArray(process.env.numIdleRounds),
        roundLockPeriodInBlocks: parseEnvArray(process.env.roundLockPeriodInBlocks),
        validPricePeriodInBlocks: parseEnvArray(process.env.validPricePeriodInBlocks),
        supportersEarnPeriodInBlocks: process.env.supportersEarnPeriodInBlocks,
        supportersMinStayBlocks: process.env.supportersMinStayBlocks,
        supportersAfterStopBlocks: process.env.supportersAfterStopBlocks
    }
    console.log("Contracts configuration", params);
    return params;
}

async function truffle_main(deployer, networkName, accounts) {
    // don't run migrations for tests, all tests create their own environment.
    if (process.argv.some(x => x.indexOf('test') >= 0)
        || process.argv.some(x => x.indexOf('coverage') >= 0)) {
        console.log("SKIPING MIGRATIONS FOR TEST");
        return;
    }
    const configParams = await config(deployer, networkName, accounts);
    await deployWithProxies(deployer, networkName, accounts, configParams);
    console.log("MIGRATIONS DONE!!!");
}

// FOR TRUFFLE
module.exports = truffle_main