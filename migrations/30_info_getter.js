'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Deploying InfoGetter');
    const infoGetter = await helpers.ozAdd('@moc/oracles/InfoGetter', {
        methodArgs: [governor.address],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: {...ozParams.txParams, gas: 4000000},
    });
    console.log('InfoGetter: ', infoGetter.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
