'use strict';
const helpers = require('@moc/shared/lib/helpers');
const Web3 = require('web3');

async function deploy({ config, ozParams, governor }, artifacts) {
    console.log('Initialize staking machine');
    const supportersAddr = helpers.ozGetAddr('@moc/oracles/Supporters', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('@moc/oracles/OracleManager', ozParams);
    const delayMachineAddr = helpers.ozGetAddr('@moc/oracles/DelayMachine', ozParams);
    const stakingMachineAddr = helpers.ozGetAddr('@moc/oracles/Staking', ozParams);
    const stakingMachine = await artifacts.require('@moc/oracles/Staking').at(stakingMachineAddr);
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
module.exports = helpers.truffleOZMain(deploy, artifacts);
