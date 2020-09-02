'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Create StakingMachine');
    const oracleManager = helpers.ozGetAddr('OracleManager', ozParams);
    const delayMachine = helpers.ozGetAddr('DelayMachine', ozParams);
    const supporters = helpers.ozGetAddr('Supporters', ozParams);
    const stakingMachine = await helpers.ozAdd('Staking', {
        methodArgs: [governor.address, supporters, oracleManager, delayMachine],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        ...ozParams,
    });
    console.log('Staking: ', stakingMachine.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
