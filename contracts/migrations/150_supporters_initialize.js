'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({ config, ozParams, governor }) {
    console.log('Deploying Supporters');
    const supporters = await helpers.ozAdd('Supporters', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: { ...ozParams.txParams, gas: 3500000 },
    });
    console.log('Supporters: ', supporters.options.address, 'Initialization still missing!!!');
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
