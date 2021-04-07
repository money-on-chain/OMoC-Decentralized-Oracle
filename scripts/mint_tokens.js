'use strict';
const helpers = require('@moc/shared/lib/helpers');
global.artifacts = artifacts;
global.web3 = web3;

async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length !== 2) {
        console.error('Usage script destination_address quantity');
        process.exit();
    }
    const destination = web3.utils.toChecksumAddress(args[0]);
    const quantity = web3.utils.toWei(args[1], 'ether');

    const MocToken = artifacts.require('MocToken');
    const testMOC = await MocToken.deployed();
    console.log('using TestMOC: ', testMOC.address);

    console.log('BALANCE BEFORE:', (await testMOC.balanceOf(destination)).toString());
    await testMOC.mint(destination, quantity);
    console.log('BALANCE AFTER:', (await testMOC.balanceOf(destination)).toString());
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
