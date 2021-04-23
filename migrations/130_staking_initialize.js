'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');
const Web3 = require('web3');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize staking machine');
    const supportersAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Supporters', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/OracleManager', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/DelayMachine', ozParams);
    const stakingMachineAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Staking', ozParams);
    const stakingMachine = await artifacts.require('@money-on-chain/omoc-decentralized-oracle/Staking').at(stakingMachineAddr);
    // TODO: The whitelist needs tha address of the VotingMachine.
    const iterableWhitelistDataLock = [];
    await stakingMachine.initialize(
        governor.address,
        supportersAddr,
        oracleManagerAddr,
        delayMachineAddr,
        iterableWhitelistDataLock,
        Web3.utils.toBN(config.stakingMachine.withdrawLockTime).toString(),
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
