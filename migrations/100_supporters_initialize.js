'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize Supporters');
    const testMOC = helpers.ozGetAddr('TestMOC', ozParams);
    const stakingMachine = helpers.ozGetAddr('@moc/oracles/Staking', ozParams);
    const supportersAddr = helpers.ozGetAddr('@moc/oracles/Supporters', ozParams);
    const supporters = await artifacts.require('@moc/oracles/Supporters').at(supportersAddr);
    await supporters.initialize(
        governor.address,
        [stakingMachine],
        testMOC,
        config.stakingMachine.supportersEarnPeriodInBlocks,
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);