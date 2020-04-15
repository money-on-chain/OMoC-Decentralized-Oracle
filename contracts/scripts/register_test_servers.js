'use strict';

const {toBN, toWei} = require('web3-utils');
const ORACLES_TO_REGISTER_BY_NETWORK = require('./TEST_SERVERS')
global.artifacts = artifacts;
global.web3 = web3;


async function isRegistered(oracleManager, addr) {
    try {
        return await oracleManager.getOracleRegistrationInfo(addr);
    } catch (err) {
        return false;
    }
}

async function main() {
    const newtworkType = await web3.eth.net.getNetworkType();
    const networkId = await web3.eth.net.getId();
    console.log("network type:" + newtworkType);
    console.log("network id:" + networkId);
    console.log(ORACLES_TO_REGISTER_BY_NETWORK);
    const oracles = ORACLES_TO_REGISTER_BY_NETWORK[networkId];
    if (!oracles) {
        console.error("Please set the right network id", Object.keys(ORACLES_TO_REGISTER_BY_NETWORK));
        process.exit();
    }

    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];
    console.log("OWNER:", owner);

    const oracleManager = await artifacts.require('OracleManager').deployed();
    console.log("OracleManager: ", oracleManager.address);

    const testMOC = await artifacts.require('TestMOC').deployed();
    console.log("TestMOC: ", testMOC.address);

    const balance = await testMOC.balanceOf(owner);
    const is_registered = {};
    for (const o of oracles) {
        is_registered[o.addr] = await isRegistered(oracleManager, o.addr);
    }
    const quantity = oracles.filter(x => (is_registered[x.addr] === false)).reduce((acc, x) => acc.add(x.quantity), toBN("0"));
    console.log("balance of mocs pre:", balance.toString(), "needed", quantity.toString());
    if (balance.lt(quantity)) {
        console.log(testMOC.address, "calling mint", owner, quantity.toString());
        await testMOC.mint(owner, quantity, {from: owner});
        console.log("balance pos:", (await testMOC.balanceOf(owner)).toString());
    }

    for (const o of oracles) {
        if (is_registered[o.addr] !== false) {
            console.log("Already registered", o.addr, is_registered[o.addr].internetName)
        } else {
            const token_approved = await testMOC.allowance(owner, oracleManager.address);
            console.log("tokenApproved:", token_approved.toString(), "needed", o.quantity.toString());
            if (token_approved.lt(o.quantity)) {
                console.log(testMOC.address, "Calling approve ", oracleManager.address, o.quantity.toString())
                testMOC.approve(oracleManager.address, o.quantity, {from: owner});
            }
            console.log(oracleManager.address, "Calling registerOracle ", o.addr, o.name, o.quantity.toString())
            await oracleManager.registerOracle(o.addr, o.name, o.quantity, {from: owner});
        }
        for (const coinPair of o.oracleCoinPairFilter) {
            const isSubscribed = await oracleManager.isSuscribed(o.addr, web3.utils.fromAscii(coinPair));
            if (isSubscribed) {
                console.log(o.addr, "already subscribed to coinpair", coinPair);
            } else {
                console.log("suscribe", o.addr, "to coinpair", coinPair);
                await oracleManager.suscribeCoinPair(o.addr, web3.utils.fromAscii(coinPair));
            }
        }
    }
}

// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
