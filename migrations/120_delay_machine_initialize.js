'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

async function deploy({config, ozParams, governor, token}) {
    console.log('Initialize DelayMachine');
    const stakingMachine = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Staking', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/DelayMachine', ozParams);
    const delayMachine = await artifacts.require('@money-on-chain/omoc-decentralized-oracle/DelayMachine').at(delayMachineAddr);
    await delayMachine.initialize(governor.address, token.address, stakingMachine);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
