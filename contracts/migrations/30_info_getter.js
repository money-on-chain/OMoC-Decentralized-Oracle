'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const Governor = artifacts.require('../moc-gobernanza/contracts/Governance/Governor.sol');

stdout.silent(false);

async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // We will use the project's proxy admin as upgradeability admin of this instance
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        network
    );
    // Deployed in 20_moc_gobernanza
    const governorOwner = accounts[0];
    const governor = await Governor.deployed();
    const governorAddr = governor.address;
    console.log("governorAddr", governorAddr, 'owner', governorOwner);
    const proxyAdminAddr = networkFile.proxyAdminAddress;
    console.log("proxyAdminAddr ", proxyAdminAddr);

    console.log("Create InfoGetter Proxy");
    await scripts.add({contractsData: [{name: "InfoGetter", alias: "InfoGetter"}]});
    await scripts.push({network, txParams: {...txParams, gas: 6000000}, force: true});
    const infoGetter = await scripts.create({
        methodName: 'initialize',
        methodArgs: [governorAddr],
        admin: proxyAdminAddr,
        contractAlias: "InfoGetter",
        network,
        txParams
    });
    console.log("InfoGetter: ", infoGetter.options.address, 'proxyAdmin', proxyAdminAddr);
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