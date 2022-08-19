'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({ ozParams, governor }, artifacts) {
    const oracles = {
        delayMachine: 'DelayMachine',
        oracleManager: 'OracleManager',
        supporters: 'Supporters',
        infoGetter: 'InfoGetter',
    };
    const addrs = {};
    for (const o of Object.keys(oracles)) {
        addrs[o] = helpers.ozGetAddr('@moc/oracles/' + oracles[o], ozParams);
    }

    addrs.registry = helpers.ozGetAddr('@moc/shared/Registry', ozParams);

    console.log('Populate registry using', addrs);
    const MocRegistryInitChange = artifacts.require('@moc/oracles/MocRegistryInitChange');
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
module.exports = helpers.truffleOZMain(deploy, artifacts);
