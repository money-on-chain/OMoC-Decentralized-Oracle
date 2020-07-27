// Use dotenv file
const path = require('path');
const rootDir = path.resolve(process.cwd(), '..');
require('dotenv').config({path: path.resolve(rootDir, '.env')});
const {files, ConfigManager} = require('@openzeppelin/cli');

function config() {
    const vars = ["PRIVATE_KEY", "CurrencyPair", "minOracleOwnerStake", "maxOraclesPerRound",
        "bootstrapPrice", "numIdleRounds", "roundLockPeriodInBlocks",
        "validPricePeriodInBlocks", "emergencyPublishingPeriodInBlocks",
        "supportersEarnPeriodInBlocks", "supportersMinStayBlocks", "supportersAfterStopBlocks"];

    if (vars.some(x => !process.env[x])) {
        console.error("The script must be configured with .env file some parameter is missing, see dotenv_example");
        console.error(vars);
        process.exit();
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
        emergencyPublishingPeriodInBlocks: parseEnvArray(process.env.emergencyPublishingPeriodInBlocks),
        supportersEarnPeriodInBlocks: process.env.supportersEarnPeriodInBlocks,
        supportersMinStayBlocks: process.env.supportersMinStayBlocks,
        supportersAfterStopBlocks: process.env.supportersAfterStopBlocks,
        externalGovernorAddr: process.env.governorAddr,
        externalProxyAdminAddr: process.env.proxyAdminAddr,
    }
    return params;
}

module.exports.config = config;

function is_production() {
    return process.argv.some(x => x.trim() === "--network")
}

module.exports.is_production = is_production;

function is_test() {
    const ret = process.argv.some(x => x === 'test')
        || process.argv.some(x => x === 'coverage');
    if (ret) {
        console.log("SKIPING MIGRATIONS FOR TEST");
    }
    return ret;
}

module.exports.is_test = is_test;


function run_slow_tests() {
    return process.argv.some(x => x.toLowerCase().indexOf("stress") >= 0)
}

module.exports.run_slow_tests = run_slow_tests;

function truffle_main(artifacts, deploy, skip_governor = false) {
    return async (deployer, networkName, accounts) => {
        if (is_test()) return;
        const cfg = config();
        const {network, txParams} = await ConfigManager.initNetworkConfiguration({
            network: networkName,
            from: accounts[0]
        });
        cfg.network = network;
        cfg.txParams = txParams;
        if (!skip_governor) {
            const Governor = artifacts.require('Governor.sol');
            cfg.governor = await Governor.deployed();
            cfg.governorAddr = cfg.governor.address;
            console.log("governorAddr", cfg.governorAddr, 'owner', accounts[0]);
            // We will use the project's proxy admin as upgradeability admin of this instance
            const networkFile = new files.NetworkFile(new files.ProjectFile(), network);
            cfg.proxyAdminAddr = networkFile.proxyAdminAddress;
            console.log("proxyAdminAddr ", cfg.proxyAdminAddr);
        }
        cfg.executeChange = async (changeAddr) => {
            const owner = await cfg.governor.owner();
            console.log("Executing", changeAddr, 'via governor', cfg.governorAddr, 'owner', owner);
            await cfg.governor.executeChange(changeAddr, {from: owner});
        }
        await deploy({deployer, networkName, accounts, ...cfg});
        console.log("MIGRATIONS STEP DONE!!!");
    }
}

module.exports.truffle_main = truffle_main;
