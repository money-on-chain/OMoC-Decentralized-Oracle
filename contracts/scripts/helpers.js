'use strict';
const fs = require('fs');
const path = require('path');
const BigNumber = require("bignumber.js");


async function printSingle(msg, contract, name) {
    try {
        const data = await contract[name]();
        console.log(msg + name, data.toString());
    } catch (e) {
        console.log(msg, "error getting", name, e.message)
    }
}

module.exports.printSingle = printSingle;

async function printProps(msg, data) {
    const props = data.abi.filter(x => (x["type"] === "function"
        && x["stateMutability"] === "view"
        && x["inputs"].length === 0
        && !x["payable"]
    ));
    if (msg.length > 0) console.log(msg);
    for (const p of props) {
        await printSingle("\t", data.contract, p["name"]);
    }

}

module.exports.printProps = printProps;

async function getAllOracles(oracle) {
    let addr = await oracle.getRegisteredOracleHead();
    const ret = [];
    while (addr !== "0x0000000000000000000000000000000000000000") {
        ret.push(addr);
        addr = await oracle.getRegisteredOracleNext(addr);
    }
    return ret;
}

module.exports.getAllOracles = getAllOracles;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.sleep = sleep;

function getContractData(jsonPath, contracts) {
    return Object.keys(contracts).reduce((acc, x) => {
        const data = JSON.parse(fs.readFileSync(path.join(jsonPath, contracts[x])));
        acc[x] = {data, abi: data.abi};
        return acc;
    }, {})
}

module.exports.getContractData = getContractData;

function getContracts(web3, contractData, addresses) {
    return Object.keys(addresses).reduce((acc, x) => {
        acc[x] = {
            addr: addresses[x],
            abi: contractData[x].abi,
            data: contractData[x],
            contract: new web3.eth.Contract(contractData[x].abi, addresses[x]),
        }
        return acc;
    }, {});
}

module.exports.getContracts = getContracts;

function coinPairStr(hex) {
    let str = "";
    for (let n = 0; n < hex.length; n += 2) {
        const ch = hex.substr(n, 2);
        if (ch === "0x" || ch === "00") {
            continue;
        }
        str += String.fromCharCode(parseInt(ch, 16));
    }
    return str;
}

module.exports.coinPairStr = coinPairStr;

function getScriptArgs(filename) {
    const scriptName = path.basename(filename);
    const script_in_args = process.argv.map(x => x.indexOf(scriptName) > 0);
    const idx = script_in_args.indexOf(true);
    if (idx < 0) {
        console.error("INVALID ARGS", script_in_args);
        process.exit();
    }
    return process.argv.splice(idx + 1);
}

module.exports.getScriptArgs = getScriptArgs;


async function getGovernor(web3, artifacts) {
    const accounts = await web3.eth.getAccounts();
    const governor = await artifacts.require('Governor').deployed();
    const governorAddr = governor.address;
    const owner = await governor.owner();
    console.log("Governor:", governorAddr);
    if (accounts[0] !== owner) {
        console.error("Governor owner doesn't match accounts[0]", accounts[0], owner);
        process.exit();
    }
    return {
        governor,
        address: governor.address,
        owner,
        executeChange: async (change) => {
            console.log("Execute change", change.address, "with governor", governor.address);
            const tx = await governor.executeChange(change.address, {from: owner})
            console.log("Call governor result", tx.tx);
        }
    };
}

module.exports.getGovernor = getGovernor;

