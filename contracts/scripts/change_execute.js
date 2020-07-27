'use strict';
/*
    Run a change contract that was already deployed with a governor address (instead of taking the address from truffle).
 */
const helpers = require("./helpers")
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;


async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length === 0) {
        console.error("Usage script governor_addr change_contract_addr");
        process.exit();
    }
    const governorAddr = web3.utils.toChecksumAddress(args[0]);
    console.log("GovernorAddr: ", governorAddr);

    const changeContractAddr = web3.utils.toChecksumAddress(args[1]);
    console.log("ChangeContractAddr: ", changeContractAddr);

    const governor = await artifacts.require('Governor').at(governorAddr);
    const accounts = await web3.eth.getAccounts();
    const governorOwner = accounts[0];
    console.log("OWNER:", governorOwner);
    const go = await governor.owner();
    if (governorOwner != go) {
        console.error("Governor owner doesn't match accounts[0]", governorOwner, go);
        process.exit();
    }

    console.log("Change: ", changeContractAddr);
    console.log("Call governor");
    const tx = await governor.executeChange(changeContractAddr, {from: governorOwner});
    console.log("Call governor result", tx.tx);
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};