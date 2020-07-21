'use strict';
const helpers = require("./helpers");
const {files, scripts} = require('@openzeppelin/cli');
const {ProxyAdmin} = require('@openzeppelin/upgrades');

async function deploy(config) {
    if (!config.deployGovernor) {
        console.log("SKIP GOVERNOR DEPLOYMENT, USE:",
            "governor", config.governorAddr,
            "proxyAdmin", config.proxyAdminAddr);
        return;
    }
    const owner = config.accounts[0];
    console.log('Deploying ProxyAdmin');
    const proxyAdmin = await ProxyAdmin.deploy(config.txParams);
    console.log('Proxy admin', proxyAdmin.address);


    console.log('Deploying governor proxy');
    scripts.add({contractsData: [{name: 'Governor', alias: 'Governor'}]});
    await scripts.push({network: config.network, txParams: config.txParams});
    const governor = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'Governor',
        methodName: 'initialize',
        methodArgs: [owner],
        network: config.network,
        txParams: config.txParams
    });
    console.log('Deploying governor', governor.options.address, 'owner', owner, 'proxyAdmin', proxyAdmin.address);


    console.log('Deploying Upgrade delegator');
    const UpgradeDelegator = artifacts.require('UpgradeDelegator');
    scripts.add({contractsData: [{name: 'UpgradeDelegator', alias: 'UpgradeDelegator'}]});
    await scripts.push({network: config.network, txParams: {...config.txParams, gas: 1400000}});
    const upgradeDelegator = await scripts.create({
        admin: proxyAdmin.address,
        contractAlias: 'UpgradeDelegator',
        methodName: 'initialize',
        methodArgs: [governor.address, proxyAdmin.address],
        network: config.network,
        txParams: config.txParams
    });
    console.log('Upgrade delegator', upgradeDelegator.options.address, 'calling initialize', governor.address, proxyAdmin.address);

    console.log('Transfer ownership from', await proxyAdmin.getOwner(), 'to', upgradeDelegator.options.address);
    await proxyAdmin.transferOwnership(upgradeDelegator.options.address);

    console.log(`-----ADDRESSES IN ${config.network}------------`);
    console.log(`Deployed governor in ${governor.address}`);
    console.log(`Deployed proxy admin in ${proxyAdmin.address}`);
    console.log(`Deployed upgradeDelegator in ${upgradeDelegator.options.address}`);

    console.log("Saving the proxy admin address so we can reuse it in other deploy scripts");
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        config.network
    );
    networkFile.proxyAdmin = {address: proxyAdmin.address};
    await networkFile.write();
}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy, true   )