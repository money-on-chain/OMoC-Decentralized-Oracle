'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');
const Web3 = require('web3');

async function deploy({config, ozParams, governor}) {
    console.log('Initialize OracleManager');
    const staking = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/Staking', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('@money-on-chain/omoc-decentralized-oracle/OracleManager', ozParams);
    const oracleManager = await artifacts
        .require('@money-on-chain/omoc-decentralized-oracle/OracleManager')
        .at(oracleManagerAddr);
    await oracleManager.initialize(
        governor.address,
        Web3.utils.toBN(config.stakingMachine.minCPSubscriptionStake).toString(),
        staking,
        [staking],
    );
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
