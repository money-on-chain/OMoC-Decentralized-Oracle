'use strict';

const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const UpgradeDelegator = artifacts.require('UpgradeDelegator');
const {ProxyAdmin} = require('@openzeppelin/upgrades');

stdout.silent(false);
stdout.log()

async function deploy(options, owner, deployer) {

    // Register initial version of my contracts in the zos project
    scripts.add({
        contractsData: [{name: 'Governor', alias: 'Governor'}]
    });
    scripts.add({
        contractsData: [{name: 'UpgradeDelegator', alias: 'UpgradeDelegator'}]
    });

    console.log('Pushing implementations');
    // Push implementation contracts to the network
    await scripts.push(options);

    const proxyAdmin = await ProxyAdmin.deploy(options.txParams);
    console.log('Proxy admin', proxyAdmin.address);

    // Create an instance of Governor, setting initial value to owner
    console.log('Deploying governor proxy');
    const governor = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'Governor',
        methodName: 'initialize',
        methodArgs: [owner],
        ...options
    });
    console.log('Deploying governor', governor.options.address, 'owner', owner, 'proxyAdmin', proxyAdmin.address);


    console.log('Deploying Upgrade delegator');
    const upgradeDelegator = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'UpgradeDelegator',
        methodName: 'initialize',
        methodArgs: [governor.address, proxyAdmin.address],
        ...options
    });
    console.log('Upgrade delegator', upgradeDelegator.options.address, 'calling initialize', governor.address, proxyAdmin.address);

    console.log('Transfer ownership from', await proxyAdmin.getOwner(), 'to', upgradeDelegator.options.address);
    await proxyAdmin.transferOwnership(upgradeDelegator.options.address);

    console.log(`-----ADDRESSES IN ${options.network}------------`);
    console.log(`Deployed governor in ${governor.address}`);
    console.log(`Deployed proxy admin in ${proxyAdmin.address}`);
    console.log(`Deployed upgradeDelegator in ${upgradeDelegator.options.address}`);

    console.log("Saving the proxy admin address so we can reuse it in other deploy scripts");
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        options.network
    );
    networkFile.proxyAdmin = {address: proxyAdmin.address};
    await networkFile.write();
}

async function truffle_main(deployer, networkName, accounts) {
    // don't run migrations for tests, all tests create their own environment.
    if (process.argv.length > 2 && process.argv[2].indexOf('test') >= 0) {
        console.log("SKIPING MIGRATIONS FOR TEST");
        return;
    }
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });
    await deploy({network, txParams}, accounts[0], deployer);
}

// FOR TRUFFLE
module.exports = truffle_main