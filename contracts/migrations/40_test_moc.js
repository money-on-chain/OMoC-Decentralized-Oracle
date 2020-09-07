'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Deploying TestMOC');
    const testMOC = await helpers.ozAdd('@moc/shared/GovernedERC20', {
        contractAlias: 'TestMOC',
        methodArgs: [governor.address],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: {...ozParams.txParams, gas: 3500000},
    });
    console.log('TestMOC: ', testMOC.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
