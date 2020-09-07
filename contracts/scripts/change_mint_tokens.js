'use strict';
const {ConfigManager} = require('@openzeppelin/cli');
const helpers = require('@moc/shared/lib/helpers');
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
    const testMOC = await helpers.ozGetContract(
        artifacts,
        '@moc/shared/TestMOC',
        '@moc/shared/IMintableERC20',
    );
    console.log('using TestMOC: ', testMOC.address);
    const governor = await helpers.ozGetContract(artifacts, '@moc/shared/Governor');
    console.log('using governor: ', governor.address);

    console.log('BALANCE BEFORE:', (await testMOC.balanceOf(destination)).toString());
    const change = await TestMOCMintChange.new(testMOC.address, destination, quantity);
    await governor.executeChange(change.address, {from: governorOwner});
    console.log('BALANCE AFTER:', (await testMOC.balanceOf(destination)).toString());
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
