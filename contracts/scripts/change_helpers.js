'use strict';
const BigNumber = require("bignumber.js");

async function getGovernor(truffle_data) {
    const {web3, artifacts} = truffle_data;
    const accounts = await web3.eth.getAccounts();
    const governorOwner = accounts[0];
    console.log("OWNER:", governorOwner);

    const governor = await artifacts.require('Governor').deployed();
    const governorAddr = governor.address;
    console.log("Governor: ", governorAddr);
    return {governor, governorOwner};
}

module.exports.getGovernor = getGovernor;


async function changeUint256Arg(trufle_data, changeFunc) {
    const {web3, artifacts} = trufle_data;
    const new_val = new BigNumber(process.argv[process.argv.length - 1]);
    if (!new_val || new_val.isNaN()) {
        console.error("Usage: script coinPair new_val");
        process.exit();
    }
    const coin_pair = web3.utils.asciiToHex(process.argv[process.argv.length - 2]).padEnd(66, '0');
    if (!coin_pair) {
        console.error("Usage: script coinPair new_val");
        process.exit();
    }

    const oracleManager = await artifacts.require('OracleManager').deployed();
    console.log("OracleManager: ", oracleManager.address);

    const coinPairAddr = await oracleManager.getContractAddress(coin_pair);
    const coinPairPrice = await artifacts.require('CoinPairPrice').at(coinPairAddr);
    console.log("CoinPairPrice: ", coinPairPrice.address);

    const {governorOwner, governor} = await getGovernor(trufle_data);

    const change = await changeFunc(new_val, coinPairPrice);

    console.log("Change: ", change.address);
    console.log("Call governor");
    const tx = await governor.executeChange(change.address, {from: governorOwner});
    console.log("Call governor result", tx.tx);
    return {new_val, coinPairPrice}
}

module.exports.changeUint256Arg = changeUint256Arg;
