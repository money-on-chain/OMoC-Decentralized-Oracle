'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const Governor = artifacts.require('../moc-gobernanza/contracts/Governance/Governor.sol');

stdout.silent(false);

async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // Deployed in 2_moc_gobernanza
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


    console.log("Create EternalStorageGobernanza Proxy");
    await scripts.add({contractsData: [{name: "EternalStorageGobernanza", alias: "EternalStorageGobernanza"}]});
    await scripts.push({network, txParams});
    const ethernalStorage = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "EternalStorageGobernanza",
        network,
        txParams
    });
    console.log("EternalStorageGobernanza: ", ethernalStorage.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Initialize ethernalStorage", 'governor', governorAddr);
    const scall = await artifacts.require("EternalStorageGobernanza").at(ethernalStorage.options.address);
    await scall.initialize(governorAddr);

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