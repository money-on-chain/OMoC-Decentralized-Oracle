'use strict';
const helpers = require('./helpers');
const {scripts} = require('@openzeppelin/cli');

async function getAddr(json_file) {
    const artifact = artifacts.require(json_file);
    const contract = await artifact.deployed();
    return contract.address;
}

async function deploy(config) {
    // Deployed in 3_deploy
    const oracleManagerAddr = await getAddr('OracleManager.sol');
    console.log('oracleManagerAddr', oracleManagerAddr);

    const supportersAddr = await getAddr('Supporters.sol');
    console.log('supportersAddr', supportersAddr);

    const infoGetterAddr = await getAddr('InfoGetter.sol');
    console.log('infoGetterAddr', infoGetterAddr);

    console.log('Create EternalStorageGobernanza Proxy');
    await scripts.add({
        contractsData: [{name: 'EternalStorageGobernanza', alias: 'EternalStorageGobernanza'}],
    });
    await scripts.push({
        network: config.network,
        txParams: helpers.is_production() ? {...config.txParams, gas: 3000000} : config.txParams,
        force: true,
    });
    const eternalStorage = await scripts.create({
        methodName: 'initialize',
        methodArgs: [config.governorAddr],
        admin: config.proxyAdminAddr,
        contractAlias: 'EternalStorageGobernanza',
        network: config.network,
        txParams: config.txParams,
    });
    console.log(
        'EternalStorageGobernanza: ',
        eternalStorage.options.address,
        'proxyAdmin',
        config.proxyAdminAddr,
    );

    console.log('Deploy change contract', config.governorAddr);
    const MocRegistryInitChange = artifacts.require('MocRegistryInitChange');
    const change = await MocRegistryInitChange.new(
        eternalStorage.options.address,
        oracleManagerAddr,
        supportersAddr,
        infoGetterAddr,
    );
    console.log(
        'Initialize registry/eternalStorage for MOC Oracles',
        change.address,
        'via governor',
        config.governorAddr,
    );
    await config.executeChange(change.address);
}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy);
