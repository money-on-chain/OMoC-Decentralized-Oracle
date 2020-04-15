'use strict';
const change_helpers = require("./change_helpers");
const BigNumber = require("bignumber.js");
global.artifacts = artifacts;
global.web3 = web3;
const truffle_data = {artifacts, web3};


async function main() {
    const new_val = new BigNumber(process.argv[process.argv.length - 1]);
    if (!new_val || new_val.isNaN()) {
        console.error("Usage script new_value");
        return
    }

    const supporters = await artifacts.require('SupportersWhitelisted').deployed();
    console.log("SupportersWhitelisted: ", supporters.address);

    const {governorOwner, governor} = await change_helpers.getGovernor(truffle_data);

    console.log("supporters period pre:", (await supporters.period()).toString());
    console.log("Deploy changer smart contract", supporters.address, new_val.toString());
    const change = await artifacts.require('SupportersWhitelistedPeriodChange').new(supporters.address, new_val);

    console.log("Change: ", change.address);
    console.log("Call governor");
    const tx = await governor.executeChange(change.address, {from: governorOwner});
    console.log("Call governor result", tx.tx);

    console.log("supporters period pos:", (await supporters.period()).toString());
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
