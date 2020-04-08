'use strict';
const {toBN, toWei} = require('web3-utils');
global.artifacts = artifacts;
global.web3 = web3;

function getArg(idx) {
    const ret = process.argv[process.argv.length + idx];
    if (!ret || isNaN(ret)) {
        console.error("Usage script upgrade_delegator_Addr proxy_addr new_implementation_addr");
        process.exit()
    }
    return ret;
}

async function main() {
    const upgradeDelegatorAddr = web3.utils.toChecksumAddress(getArg(-3));
    console.log("UpgradeDelegatorAddr: ", upgradeDelegatorAddr);

    const proxyAddr = web3.utils.toChecksumAddress(getArg(-2));
    console.log("Current proxy address: ", proxyAddr);

    const newImplementationAddr = web3.utils.toChecksumAddress(getArg(-1));
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

    console.log("Old implementation: ", await upgradeDelegator.getProxyImplementation(proxyAddr));

    console.log("Deploy changer smart contract", proxyAddr, upgradeDelegatorAddr, newImplementationAddr);
    const change = await artifacts.require('UpgraderTemplate').new(proxyAddr, upgradeDelegatorAddr, newImplementationAddr);
    console.log("Change: ", change.address);
    console.log("Call governor");
    const tx = await governor.executeChange(change.address, {from: governorOwner});
    console.log("Call governor result", tx.tx);

    console.log("New implementation: ", await upgradeDelegator.getProxyImplementation(proxyAddr));
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
