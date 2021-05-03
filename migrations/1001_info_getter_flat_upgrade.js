'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({ ozParams, governor, artifacts }) {
    await helpers.ozUpgrade(artifacts, governor, '@money-on-chain/omoc-decentralized-oracle/InfoGetterFlat', {
        contractAlias: 'InfoGetter',
        network: ozParams.network,
        txParams: { ...ozParams.txParams, gas: 4000000 },
        force: true,
    });
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
