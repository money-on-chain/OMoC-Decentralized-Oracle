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
    const withdrawLockTime = 1701;
    console.log('Try to initialize() with a withdrawLockTime of:', withdrawLockTime);
    try {
        await newContract.initialize(
            '0x0000000000000000000000000000000000000001', //governor
            '0x2Bb08e5DFb88477A88180Fbb7eF8196fbdea4Cd5', //supporters (needs a real one)
            '0x0000000000000000000000000000000000000001', //oracleManager
            '0x0000000000000000000000000000000000000001', //delayMachine
            [], //wlistlock,
            withdrawLockTime, //withdrawLockTime
        );
    } catch (err) {
        console.log(
            'initialize() failed! (which is probably a good thing) TXID:',
            err.tx,
            'Reason:',
            err.reason,
        );
    }

    const t = await newContract.getWithdrawLockTime();
    console.log('Get WithdrawLockTime from the contract:', t.toString());
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
