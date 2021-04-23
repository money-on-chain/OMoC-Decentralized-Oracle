'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Deploying OraclesManager');
    const oracleManager = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/OracleManager', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: helpers.isProduction() ? {...config.txParams, gas: 4300000} : config.txParams,
    });
    console.log('OracleManager: ', oracleManager.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
