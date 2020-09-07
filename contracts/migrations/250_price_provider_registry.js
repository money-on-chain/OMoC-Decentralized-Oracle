'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    const oracleManagerAddr = await helpers.ozGetAddr('OracleManager', ozParams);
    console.log('oracleManagerAddr', oracleManagerAddr);

    console.log('Create PriceProviderRegister');
    const priceProviderRegister = await helpers.ozAdd('PriceProviderRegister', {
        methodArgs: [governor.address],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: {...ozParams.txParams},
    });
    console.log('PriceProviderRegister: ', priceProviderRegister.address);

    console.log('Register the OracleManager coinpairs in price provider register by gobernanza');
    const ChangeContract = artifacts.require('PriceProviderOracleManagerRegisterPairChange');
    const change = await ChangeContract.new(priceProviderRegister.address, oracleManagerAddr);
    await governor.executeChange(change.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
