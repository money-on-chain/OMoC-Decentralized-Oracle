'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({ozParams, governor}) {
    const oracles = {
        delayMachine: 'DelayMachine',
        oracleManager: 'OracleManager',
        supporters: 'Supporters',
        infoGetter: 'InfoGetter',
    };
    const addrs = {};
    for (const o of Object.keys(oracles)) {
        addrs[o] = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/' + oracles[o], ozParams);
    }

    addrs.registry = helpers.ozGetAddr('@money-on-chain/omoc-sc-shared/Registry', ozParams);

    console.log('Populate registry using', addrs);
    const MocRegistryInitChange = artifacts.require('@money-on-chain/omoc-decentralized-oracle/MocRegistryInitChange');
    const change = await MocRegistryInitChange.new(
        addrs.registry,
        addrs.delayMachine,
        addrs.oracleManager,
        addrs.supporters,
        addrs.infoGetter,
    );
    console.log(
        'Initialize registry for MOC Oracles',
        change.address,
        'via governor',
        governor.address,
    );
    await governor.executeChange(change.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
