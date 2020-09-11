/*
    This script is used to upgrade the coinpairprice smart contract.
    Is a specific condition, not for daily use!!!
 */

'use strict';
const helpers = require('./helpers');
global.artifacts = artifacts;
global.web3 = web3;

function getArg(idx) {
    const ret = process.argv[process.argv.length + idx];
    if (!ret || isNaN(ret)) {
        console.error("Usage script oracle_manager_addr");
        process.exit()
    }
    return ret;
}

async function main() {
    const oracleManagerAddr = web3.utils.toChecksumAddress(getArg(-1));
    console.log("OracleManagerAddr: ", oracleManagerAddr);
    const oracleManager = await artifacts.require('OracleManager').at(oracleManagerAddr);

    const coinCant = await oracleManager.getCoinPairCount();
    for (let i = 0; i < coinCant; i++) {
        const coinPair = await oracleManager.getCoinPairAtIndex(i);
        const oldImplementationProxy = await oracleManager.getContractAddress(coinPair);
        // We don't call initialize, there are no changes to the storage.
        const newImplementation = await artifacts.require('CoinPairPrice').new();
        console.log(helpers.coinPairStr(coinPair), "Execute: truffle exec --network some_network scripts/change_implementation_by_gobernanza.js upgrade_delegator_addr",
            oldImplementationProxy, newImplementation.address);

    }
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
