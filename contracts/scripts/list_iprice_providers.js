'use strict';
global.artifacts = artifacts;
global.web3 = web3;
const helpers = require("./helpers");
const BigNumber = require("bignumber.js");
BigNumber.config({DECIMAL_PLACES: 12});

async function main() {
    const contract = await artifacts.require("PriceProviderRegister").deployed();
    const cant = await contract.getCoinPairCount();
    console.log("Registered", cant.toString(), "coinpairs");
    for (let i = 0; cant.gtn(i); i++) {
        const coin_pair = await contract.getCoinPairAtIndex(i);
        const addr = await contract.getContractAddress(coin_pair);
        console.log("Coin pair", web3.utils.toAscii(coin_pair), "addr", addr);
        const provider = await artifacts.require("IPriceProvider").at(addr);
        const val = await provider.peek({from: "0x" + "0".repeat(39) + "1"});

        console.log("\t Price:", new BigNumber(val[0], 16).div(10 ** 18).toString(), (val[1] ? "VALID" : "INVALID"));
    }
}

// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};

