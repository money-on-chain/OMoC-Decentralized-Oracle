'use strict';
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;

function getArg(idx) {
    const ret = process.argv[process.argv.length + idx];
    if (!ret || isNaN(ret)) {
        console.error("Usage script governor change_contract_addr");
        process.exit()
    }
    return ret;
}

async function main() {
    const governor_addr = getArg(-2);
    const governorAddr = web3.utils.toChecksumAddress(governor_addr);
    console.log("GovernorAddr: ", governorAddr);

    const change_addr = getArg(-1);
    const changeContractAddr = web3.utils.toChecksumAddress(change_addr);
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

    console.log("Change: ", change_addr);
    console.log("Call governor");
    const tx = await governor.executeChange(change_addr, {from: governorOwner});
    console.log("Call governor result", tx.tx);
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
