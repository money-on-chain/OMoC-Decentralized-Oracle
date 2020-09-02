'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize DelayMachine');
    const testMOC = helpers.ozGetAddr('TestMOC', ozParams);
    const stakingMachine = helpers.ozGetAddr('Staking', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('DelayMachine', ozParams);
    const delayMachine = await artifacts.require('DelayMachine').at(delayMachineAddr);
    await delayMachine.initialize(governor.address, testMOC, stakingMachine);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
