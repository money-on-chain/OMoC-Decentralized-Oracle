'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({ config, ozParams, governor, token }, artifacts) {
    console.log('Initialize DelayMachine');
    const stakingMachine = helpers.ozGetAddr('@moc/oracles/Staking', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('@moc/oracles/DelayMachine', ozParams);
    const delayMachine = await artifacts.require('@moc/oracles/DelayMachine').at(delayMachineAddr);
    await delayMachine.initialize(governor.address, token.address, stakingMachine);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy, artifacts);
