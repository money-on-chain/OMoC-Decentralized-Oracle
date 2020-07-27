'use strict';
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;
const helpers = require('./helpers');

// DO THE SAME AS change_execute for a change contract that doesn't take parameters and
// getting info from build directory!!!.
async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length < 1) {
        console.error("Usage script change_contract_name args ...");
        process.exit();
    }
    const changeName = args[0];
    const contractArgs = args.splice(1)
    console.log("Deploy change contract", changeName, "with args", contractArgs)
    const ChangeContract = await artifacts.require(changeName);
    const changeContract = await ChangeContract.new(...contractArgs)

    const accounts = await web3.eth.getAccounts();
    const governor = helpers.getGovernor(web3, artifacts);
    await governor.executeChange(changeContract);
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
