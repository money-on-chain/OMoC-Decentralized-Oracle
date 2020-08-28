'use strict';
/*
    Change the current truffle governor to a new governor in all governable smart-contracts.
 */
const {scripts} = require('@openzeppelin/cli');
const helpers = require('./helpers');
const BigNumber = require('bignumber.js');
const constants = require('@openzeppelin/test-helpers/src/constants');
global.artifacts = artifacts;
global.web3 = web3;

async function getContract(governor, contractName) {
    const c = await artifacts.require(contractName).deployed();
    const current = await c.governor();
    console.log('\t', contractName, '(', c.address, ')');
    if (governor.address !== current) {
        console.error(
            "Governor addresses don't match deployed",
            governor.address,
            '!== current',
            current,
        );
        process.exit();
    }
    return c;
}

async function getCoinPairs(governor, coinPairRegisterName) {
    const coinPairRegister = await getContract(governor, coinPairRegisterName);
    const ret = [coinPairRegister.address];
    const coinPairCount = await coinPairRegister.getCoinPairCount();
    for (let i = 0; i < coinPairCount; i++) {
        const cp = await coinPairRegister.getCoinPairAtIndex(i);
        const addr = await coinPairRegister.getContractAddress(cp);
        const c = await artifacts.require('Governed').at(addr);
        const current = await c.governor();
        console.log('\t\t coinPair', web3.utils.toAscii(cp), '(', addr, ')');
        if (governor.address !== current) {
            console.error("Governor addresses don't match", governor.address, '!==', current);
            process.exit();
        }
        ret.push(addr);
    }
    return ret;
}

async function main() {
    const args = helpers.getScriptArgs(__filename);
    if (args.length < 1 || args.length > 2) {
        console.error('Usage: script new_governor_addr [old_governor_addr]');
        process.exit();
    }
    const newGovernorAddr = web3.utils.toChecksumAddress(args[0]);
    const newGovernor = await artifacts.require('Governor').at(newGovernorAddr);

    const Governor = artifacts.require('Governor');
    let governor = await Governor.deployed();
    if (args.length === 2) {
        const oldGovernorAddr = web3.utils.toChecksumAddress(args[1]);
        governor = await Governor.at(oldGovernorAddr);
    }

    const accounts = await web3.eth.getAccounts();
    const owner = await governor.owner();
    if (accounts[0] !== owner) {
        console.error("Governor owner doesn't match accounts[0]", accounts[0], owner);
        process.exit();
    }
    console.log('Old Governor Addr:', governor.address, 'OLD OWNER:', owner);

    console.log('Governables to change:');
    const governableList = [];
    const contractNames = [
        'EternalStorageGobernanza',
        'InfoGetter',
        'SupportersVested',
        'Supporters',
        'TestMOC',
    ];
    for (const n of contractNames) {
        const c = await getContract(governor, n);
        governableList.push(c.address);
    }

    const oracleManagerCps = await getCoinPairs(governor, 'OracleManager');
    governableList.push(...oracleManagerCps.filter((x) => !governableList.includes(x)));

    const registerCps = await getCoinPairs(governor, 'PriceProviderRegister');
    governableList.push(...registerCps.filter((x) => !governableList.includes(x)));

    const new_owner = await newGovernor.owner();
    if (new_owner === constants.ZERO_ADDRESS) {
        console.error(
            'New owner is address zero, the new governor',
            newGovernor.address,
            'must be configured correctly',
        );
        process.exit();
    }
    console.log('New Governor Addr:', newGovernor.address, 'NEW OWNER:', new_owner);

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const yes_no = await new Promise((resolve) =>
        rl.question(
            'YOU WILL LOOSE THE CONTROL OF THE SYSTEM!!!!, are you sure (yes/no)? ',
            (answer) => {
                resolve(answer);
                rl.close();
            },
        ),
    );
    if (yes_no.toLowerCase() === 'yes') {
        const GovernorChange = artifacts.require('GovernorChange');
        const change = await GovernorChange.new(newGovernor.address, governableList);
        await governor.executeChange(change.address, {from: owner});
    }
}

// For truffle exec
module.exports = function (callback) {
    main()
        .then(() => callback())
        .catch((err) => callback(err));
};
