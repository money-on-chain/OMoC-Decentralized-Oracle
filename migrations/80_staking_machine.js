'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    console.log('Create StakingMachine');
    const stakingMachine = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/Staking', {
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        ...ozParams,
        txParams: {...ozParams.txParams, gas: 5000000},
    });
    console.log('Staking: ', stakingMachine.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
