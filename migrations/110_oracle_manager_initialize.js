'use strict';
const helpers = require('@moc/shared/lib/helpers');
const Web3 = require('web3');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize OracleManager');
    const staking = helpers.ozGetAddr('@moc/oracles/Staking', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('@moc/oracles/OracleManager', ozParams);
    const oracleManager = await artifacts
        .require('@moc/oracles/OracleManager')
        .at(oracleManagerAddr);
    await oracleManager.initialize(
        governor.address,
        Web3.utils.toBN(config.stakingMachine.minCPSubscriptionStake),
        staking,
        [staking],
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
