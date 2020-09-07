'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Create DelayMachine');
    const delayMachine = await helpers.ozAdd('DelayMachine', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: helpers.isProduction() ? {...config.txParams, gas: 1800000} : config.txParams,
    });
    console.log('DelayMachine: ', delayMachine.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
