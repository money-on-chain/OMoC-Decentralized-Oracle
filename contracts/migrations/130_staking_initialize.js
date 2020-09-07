'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize staking machine');
    const supportersAddr = helpers.ozGetAddr('Supporters', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('OracleManager', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('DelayMachine', ozParams);
    const stakingMachineAddr = helpers.ozGetAddr('Staking', ozParams);
    const stakingMachine = await artifacts.require('Staking').at(stakingMachineAddr);
    await stakingMachine.initialize(
        governor.address,
        supportersAddr,
        oracleManagerAddr,
        delayMachineAddr,
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
