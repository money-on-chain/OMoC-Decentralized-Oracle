'use strict';

const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const UpgradeDelegator = artifacts.require('UpgradeDelegator');
const {ProxyAdmin} = require('@openzeppelin/upgrades');

stdout.silent(false);
stdout.log()

async function deploy(network, txParams, owner, deployer) {

    console.log('Deploying ProxyAdmin');
    const proxyAdmin = await ProxyAdmin.deploy(txParams);
    console.log('Proxy admin', proxyAdmin.address);


    console.log('Deploying governor proxy');
    scripts.add({contractsData: [{name: 'Governor', alias: 'Governor'}]});
    await scripts.push({network, txParams});
    const governor = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'Governor',
        methodName: 'initialize',
        methodArgs: [owner],
        network, txParams
    });
    console.log('Deploying governor', governor.options.address, 'owner', owner, 'proxyAdmin', proxyAdmin.address);


    console.log('Deploying Upgrade delegator');
    scripts.add({contractsData: [{name: 'UpgradeDelegator', alias: 'UpgradeDelegator'}]});
    await scripts.push({network, txParams: {...txParams, gas: 1400000}});
    const upgradeDelegator = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'UpgradeDelegator',
        methodName: 'initialize',
        methodArgs: [governor.address, proxyAdmin.address],
        network, txParams
    });
    console.log('Upgrade delegator', upgradeDelegator.options.address, 'calling initialize', governor.address, proxyAdmin.address);

    console.log('Transfer ownership from', await proxyAdmin.getOwner(), 'to', upgradeDelegator.options.address);
    await proxyAdmin.transferOwnership(upgradeDelegator.options.address);

    console.log(`-----ADDRESSES IN ${network}------------`);
    console.log(`Deployed governor in ${governor.address}`);
    console.log(`Deployed proxy admin in ${proxyAdmin.address}`);
    console.log(`Deployed upgradeDelegator in ${upgradeDelegator.options.address}`);

    console.log("Saving the proxy admin address so we can reuse it in other deploy scripts");
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        network
    );
    networkFile.proxyAdmin = {address: proxyAdmin.address};
    await networkFile.write();
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
    await deploy(network, txParams, accounts[0], deployer);
}

// FOR TRUFFLE
module.exports = truffle_main