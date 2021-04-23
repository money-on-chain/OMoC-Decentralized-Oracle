'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({ config, ozParams, governor }) {
    console.log('Deploying Supporters');
    const supporters = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/Supporters', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: { ...ozParams.txParams, gas: 3500000 },
    });
    console.log('Supporters: ', supporters.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
