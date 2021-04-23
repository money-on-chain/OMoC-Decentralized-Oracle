'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Create DelayMachine');
    const delayMachine = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/DelayMachine', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: helpers.isProduction() ? {...config.txParams, gas: 1800000} : config.txParams,
    });
    console.log('DelayMachine: ', delayMachine.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
