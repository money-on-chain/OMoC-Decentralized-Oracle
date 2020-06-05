'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');

stdout.silent(false);

async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // Deployed in 2_moc_gobernanza
    const governorOwner = accounts[0];
    const Governor = artifacts.require('../moc-gobernanza/contracts/Governance/Governor.sol');
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

    // Deployed in 3_deploy
    const OracleManager = artifacts.require('OracleManager.sol');
    const oracleManager = await OracleManager.deployed();
    const oracleManagerAddr = oracleManager.address;
    console.log("oracleManagerAddr", oracleManagerAddr);

    const CoinPairPrice = artifacts.require('CoinPairPrice.sol');
    const coinPairPrice = await CoinPairPrice.deployed();
    const coinPairPriceAddr = coinPairPrice.address;
    console.log("coinPairPriceAddr", coinPairPriceAddr);


    console.log("Create UIInfoGetter Proxy");
    await scripts.add({contractsData: [{name: "UIInfoGetter", alias: "UIInfoGetter"}]});
    await scripts.push({network,  txParams: {...txParams, gas: 3000000}});
    const uiInfoGetter = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "UIInfoGetter",
        network,
        txParams
    });
    console.log("UIInfoGetter: ", uiInfoGetter.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Initialize UIInfoGetter governor", governorAddr,
        "coinPairPrice", coinPairPriceAddr,
        "oracleManager", oracleManagerAddr);
    const scall = await artifacts.require("UIInfoGetter").at(uiInfoGetter.options.address);
    await scall.initialize(governorAddr, coinPairPriceAddr, oracleManagerAddr);
}

async function truffle_main(deployer, networkName, accounts) {
    // don't run migrations for tests, all tests create their own environment.
    if (process.argv.some(x => x.indexOf('test') >= 0)
        || process.argv.some(x => x.indexOf('coverage') >= 0)) {
        console.log("SKIPING MIGRATIONS FOR TEST");
        return;
    }
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });
    await deploy(deployer, networkName, accounts);
    console.log("MIGRATIONS DONE!!!");
}

// FOR TRUFFLE
module.exports = truffle_main