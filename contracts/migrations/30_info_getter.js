'use strict';
const helpers = require("./helpers");
const {files, scripts} = require('@openzeppelin/cli');
const Governor = artifacts.require('../moc-gobernanza/contracts/Governance/Governor.sol');

async function deploy(config) {
    console.log("Create InfoGetter Proxy");
    await scripts.add({contractsData: [{name: "InfoGetter", alias: "InfoGetter"}]});
    await scripts.push({network: config.network, txParams: {...config.txParams, gas: 3000000}, force: true});
    const infoGetter = await scripts.create({
        methodName: 'initialize',
        methodArgs: [config.governorAddr],
        admin: config.proxyAdminAddr,
        contractAlias: "InfoGetter",
        network: config.network,
        txParams: config.txParams
    });
    console.log("InfoGetter: ", infoGetter.options.address, 'proxyAdmin', config.proxyAdminAddr);
}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy)