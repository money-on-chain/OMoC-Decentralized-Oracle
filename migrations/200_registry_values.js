'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({ozParams, governor}) {
    const delayMachineAddr = await helpers.ozGetAddr('@moc/oracles/DelayMachine', ozParams);
    console.log('delayMachineAddr', delayMachineAddr);

    const oracleManagerAddr = await helpers.ozGetAddr('@moc/oracles/OracleManager', ozParams);
    console.log('oracleManagerAddr', oracleManagerAddr);

    const supportersAddr = await helpers.ozGetAddr('@moc/oracles/Supporters', ozParams);
    console.log('supportersAddr', supportersAddr);

    const infoGetterAddr = await helpers.ozGetAddr('@moc/oracles/InfoGetter', ozParams);
    console.log('infoGetterAddr', infoGetterAddr);

    const registryAddr = helpers.ozGetAddr('@moc/shared/Registry', ozParams);
    console.log('Registry: ', registryAddr);

    const MocRegistryInitChange = artifacts.require('@moc/oracles/MocRegistryInitChange');
    const change = await MocRegistryInitChange.new(
        registryAddr,
        delayMachineAddr,
        oracleManagerAddr,
        supportersAddr,
        infoGetterAddr,
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
module.exports = helpers.truffleOZMain(deploy);
