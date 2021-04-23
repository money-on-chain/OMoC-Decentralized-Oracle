'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({config, ozParams, governor, token}) {
    console.log('Initialize Supporters');
    const stakingMachine = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Staking', ozParams);
    const supportersAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Supporters', ozParams);
    const supporters = await artifacts.require('@money-on-chain/omoc-decentralized-oracle/Supporters').at(supportersAddr);
    await supporters.initialize(
        governor.address,
        [stakingMachine],
        token.address,
        config.stakingMachine.supportersEarnPeriodInBlocks,
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
