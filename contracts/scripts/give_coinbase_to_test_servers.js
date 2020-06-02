'use strict';

const {toBN, toWei, fromWei} = require('web3-utils');
const ORACLES_TO_REGISTER_BY_NETWORK = require('./TEST_SERVERS')
global.artifacts = artifacts;
global.web3 = web3;

const EACH_NEEDED = toBN(toWei("0.05", "ether"));
const ZERO = toBN("0");

async function main() {
    const newtworkType = await web3.eth.net.getNetworkType();
    const networkId = await web3.eth.net.getId();
    console.log("network type:" + newtworkType);
    console.log("network id:" + networkId);
    const oracles = ORACLES_TO_REGISTER_BY_NETWORK[networkId];
    if (!oracles) {
        console.error("Please set the right network id", Object.keys(ORACLES_TO_REGISTER_BY_NETWORK));
        process.exit();
    }

    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];
    console.log("OWNER:", owner)
    const balance = toBN(await web3.eth.getBalance(owner));
    console.log("OWNER BALANCE:", balance.toString(10), "NEEDED BY EACH", EACH_NEEDED.toString(10));

    const balances = {};
    for (const o of oracles) {
        const b = toBN(await web3.eth.getBalance(o.addr));
        balances[o.addr] = {
            addr: o.addr,
            balance: b,
            balance_str: fromWei(b) + " ether",
            need: EACH_NEEDED.sub(b),
        };
    }
    console.log("ORACLE BALANCES:", Object.keys(balances)
        .map(x => [balances[x].addr, balances[x].balance_str]));
    const need = Object.keys(balances).filter(x => balances[x].need.gt(ZERO));
    const total_needed = need.reduce((acc, x) => acc.add(balances[x].need), ZERO);
    if (balance.lt(total_needed)) {
        console.error("Not enough balance", balance.toString(10), " < ", total_needed.toString(10));
        process.exit();
    }
    for (const addr of need) {
        const value = balances[addr].need.toString(10);
        console.log("Transfer from", owner, "to", addr, value, "weis");
        await web3.eth.sendTransaction({
            to: addr,
            from: owner,
            value,
        });
    }
    console.log("ALL DONE!!!");
}

// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
