'use strict';
const helpers = require("./helpers");
const {scripts} = require('@openzeppelin/cli');

async function deploy(config) {
    // Deployed in 3_deploy
    const OracleManager = artifacts.require('OracleManager.sol');
    const oracleManager = await OracleManager.deployed();
    const oracleManagerAddr = oracleManager.address;
    console.log("oracleManagerAddr", oracleManagerAddr);

    console.log("Create PriceProviderRegister");
    await scripts.add({contractsData: [{name: "PriceProviderRegister", alias: "PriceProviderRegister"}]});
    // Give more gas!!!
    await scripts.push({network: config.network, txParams: {...config.txParams}, force: true});
    const priceProviderRegister = await scripts.create({
        methodName: 'initialize',
        methodArgs: [config.governorAddr],
        admin: config.proxyAdminAddr,
        contractAlias: "PriceProviderRegister",
        network: config.network,
        txParams: config.txParams
    });
    console.log("PriceProviderRegister: ", priceProviderRegister.options.address, 'proxyAdmin', config.proxyAdminAddr);

    console.log("Register the OracleManager coinpairs in price provider register by gobernanza", config.governorAddr);
    const ChangeContract = artifacts.require("PriceProviderOracleManagerRegisterPairChange");
    const change = await ChangeContract.new(priceProviderRegister.options.address, oracleManagerAddr);
    await config.executeChange(change.address);
}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy)