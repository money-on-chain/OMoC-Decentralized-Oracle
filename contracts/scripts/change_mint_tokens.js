'use strict';
const helpers = require('./helpers');
global.artifacts = artifacts;
global.web3 = web3;

async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length != 2) {
        console.error('Usage script destination_address quantity');
        process.exit();
    }
    const destination = web3.utils.toChecksumAddress(args[0]);
    const quantity = web3.utils.toWei(args[1], 'ether');
    const accounts = await web3.eth.getAccounts();
    const governorOwner = accounts[0];

    const TestMOCMintChange = artifacts.require('TestMOCMintChange');
    const TestMOC = artifacts.require('@moc/shared/GovernedERC20');
    const testMoc = await TestMOC.deployed();
    const Governor = artifacts.require('Governor');
    const governor = await Governor.deployed();

    console.log('BALANCE BEFORE:', (await testMoc.balanceOf(destination)).toString());
    const change = await TestMOCMintChange.new(testMoc.address, destination, quantity);
    await governor.executeChange(change.address, {from: governorOwner});
    console.log('BALANCE AFTER:', (await testMoc.balanceOf(destination)).toString());
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
