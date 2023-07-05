'use strict';
const helpers = require('./helpers');
global.artifacts = artifacts;
global.web3 = web3;

async function main() {
    const contractType = 'Staking';
    const Contract = await artifacts.require(contractType);
    console.log('Creating a new implementation for:', contractType);
    const newContract = await Contract.new({ gas: 5000000 });
    console.log('Address:', newContract.address);
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
