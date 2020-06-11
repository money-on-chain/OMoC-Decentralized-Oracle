'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');

stdout.silent(false);

async function getAddr(json_file) {
    const artifact = artifacts.require(json_file);
    const contract = await artifact.deployed();
    return contract.address;
}

async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // Deployed in 20_moc_gobernanza
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
    const oracleManagerAddr = await getAddr('OracleManager.sol');
    console.log("oracleManagerAddr", oracleManagerAddr);

    const supportersVestedAddr = await getAddr('SupportersVested.sol');
    console.log("supportersVestedAddr", supportersVestedAddr);

    const supportersWhitelistedAddr = await getAddr('SupportersWhitelisted.sol');
    console.log("supportersWhitelistedAddr", supportersWhitelistedAddr);

    const infoGetterAddr = await getAddr('InfoGetter.sol');
    console.log("infoGetterAddr", infoGetterAddr);


    console.log("Create EternalStorageGobernanza Proxy");
    await scripts.add({contractsData: [{name: "EternalStorageGobernanza", alias: "EternalStorageGobernanza"}]});
    await scripts.push({network, txParams: {...txParams, gas: 6000000}});
    const eternalStorage = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "EternalStorageGobernanza",
        network,
        txParams
    });
    console.log("EternalStorageGobernanza: ", eternalStorage.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Initialize eternalStorage governor", governorAddr);
    const scall = await artifacts.require("EternalStorageGobernanza").at(eternalStorage.options.address);
    await scall.initialize(governorAddr);

    console.log("Deploy change contract", governorAddr);
    const MocRegistryInitChange = artifacts.require("MocRegistryInitChange");
    const change = await MocRegistryInitChange.new(eternalStorage.options.address,
        oracleManagerAddr,
        supportersVestedAddr,
        supportersWhitelistedAddr,
        infoGetterAddr,
    );
    console.log("Initialize registry/eternalStorage for MOC Oracles", change.address, 'via governor', governorAddr);
    await governor.executeChange(change.address, {from: governorOwner});
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