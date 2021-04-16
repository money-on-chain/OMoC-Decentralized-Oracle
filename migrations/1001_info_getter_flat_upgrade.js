'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({ ozParams, governor }) {
    await helpers.ozUpgrade(governor, '@moc/oracles/InfoGetterFlat', {
        contractAlias: 'InfoGetter',
        network: ozParams.network,
        txParams: { ...ozParams.txParams, gas: 4000000 },
        force: true,
    });
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy, artifacts);
