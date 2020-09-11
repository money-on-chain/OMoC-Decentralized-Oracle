'use strict';
const helpers = require("./helpers");
global.artifacts = artifacts;
global.web3 = web3;
const truffle_data = {artifacts, web3};

async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length < 2) {
        console.error("Usage script coinPair change_contract_name args ...");
        process.exit();
    }
    const coin_pair = web3.utils.asciiToHex(args[0]).padEnd(66, '0');
    if (!coin_pair) {
        console.error("Usage: script coinPair new_val");
        process.exit();
    }
    const oracleManager = await artifacts.require('OracleManager').deployed();
    console.log("OracleManager: ", oracleManager.address);
    const coinPairAddr = await oracleManager.getContractAddress(coin_pair);
    console.log("coinPairAddr: ", coinPairAddr);


    const changeName = args[1];
    const contractArgs = [coinPairAddr, ...args.splice(2)]
    console.log("Deploy change contract", changeName, "with args", contractArgs)
    const ChangeContract = await artifacts.require(changeName);
    const changeContract = await ChangeContract.new(...contractArgs)
    const governor = helpers.getGovernor(web3, artifacts);
    await governor.executeChange(changeContract);
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
