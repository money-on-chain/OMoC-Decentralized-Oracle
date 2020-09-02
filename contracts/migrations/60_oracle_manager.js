'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Deploying OraclesManager');
    const oracleManager = await helpers.ozAdd('OracleManager', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: helpers.isProduction() ? {...config.txParams, gas: 4300000} : config.txParams,
    });
    console.log('OracleManager: ', oracleManager.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
