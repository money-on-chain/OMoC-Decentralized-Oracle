'use strict';
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;
const helpers = require('./helpers');

// DO THE SAME AS change_execute for a change contract that doesn't take parameters and
// getting info from build directory!!!.
async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length == 0) {
        console.error("Usage script change_contract_name args ...");
        process.exit();
    }
    const changeName = args[0];
    const contractArgs = args.splice(1)
    console.log("Deploy change contract", changeName, "with args", contractArgs)
    const ChangeContract = await artifacts.require(changeName);
    const changeContract = await ChangeContract.new(...contractArgs)
    const changeContractAddr = changeContract.address;
    console.log("ChangeContractAddr: ", changeContractAddr);

    const governor = await artifacts.require('Governor').deployed();
    const accounts = await web3.eth.getAccounts();
    const governorOwner = accounts[0];
    console.log("governor", governor.address, "OWNER", governorOwner);
    const go = await governor.owner();
    if (governorOwner != go) {
        console.error("Governor owner doesn't match accounts[0]", governorOwner, go);
        process.exit();
    }

    console.log("Call governor");
    const tx = await governor.executeChange(changeContractAddr, {from: governorOwner});
    console.log("Call governor result", tx.tx);
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
