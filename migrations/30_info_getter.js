'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({ config, ozParams, governor }) {
    console.log('Deploying InfoGetter');
    const infoGetter = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/InfoGetter', {
        methodArgs: [governor.address],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: { ...ozParams.txParams, gas: 4000000 },
    });
    console.log('InfoGetter: ', infoGetter.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
