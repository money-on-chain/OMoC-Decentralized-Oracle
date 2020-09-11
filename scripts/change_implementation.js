'use strict';
/*
    Change the upgrade delegator, proxy admin addr and gobernor from the ones declared in truffle.
 */
const helpers = require("./helpers");
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;

async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length < 3) {
        console.error("Usage script upgrade_delegator_Addr proxy_addr new_implementation_addr");
        process.exit();
    }
    const upgradeDelegatorAddr = web3.utils.toChecksumAddress(args[0]);
    console.log("UpgradeDelegatorAddr: ", upgradeDelegatorAddr);

    const proxyAddr = web3.utils.toChecksumAddress(args[1]);
    console.log("Current proxy address: ", proxyAddr);

    const newImplementationAddr = web3.utils.toChecksumAddress(args[2]);
    console.log("NewImplementationAddr: ", newImplementationAddr);

    const upgradeDelegator = await artifacts.require('UpgradeDelegator').at(upgradeDelegatorAddr);
    const governorAddr = await upgradeDelegator.governor();
    console.log("got governor form upgradeDelegator: ", governorAddr);

    const governor = await artifacts.require('Governor').at(governorAddr);
    const accounts = await web3.eth.getAccounts();
    const governorOwner = accounts[0];
    console.log("OWNER:", governorOwner);
    const go = await governor.owner();
    if (governorOwner != go) {
        console.error("Governor owner doesn't match accounts[0]", governorOwner, go);
        process.exit();
    }

    const oldImpl = await upgradeDelegator.getProxyImplementation(proxyAddr);
    console.log("Old implementation: ", oldImpl);
    console.log("Old implementation Code sha3: ", web3.utils.sha3(await web3.eth.getCode(oldImpl)));

    console.log("Deploy changer smart contract", proxyAddr, upgradeDelegatorAddr, newImplementationAddr);
    const change = await artifacts.require('UpgraderTemplate').new(proxyAddr, upgradeDelegatorAddr, newImplementationAddr);
    console.log("Change: ", change.address);
    console.log("Call governor");
    const tx = await governor.executeChange(change.address, {from: governorOwner});
    console.log("Call governor result", tx.tx);

    const newImpl = await upgradeDelegator.getProxyImplementation(proxyAddr);
    console.log("New implementation: ", newImpl);
    console.log("New implementation Code sha3: ", web3.utils.sha3(await web3.eth.getCode(newImpl)));
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
