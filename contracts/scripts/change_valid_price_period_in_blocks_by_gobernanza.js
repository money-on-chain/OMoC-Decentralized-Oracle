'use strict';
const change_helpers = require("./change_helpers");
global.artifacts = artifacts;
global.web3 = web3;
const truffle_data = {artifacts, web3};

async function main() {
    const {coinPairPrice} = await change_helpers.changeUint256Arg(truffle_data, async (new_val, coinPairPrice) => {
        console.log("validPricePeriodInBlocks pre:", (await coinPairPrice.validPricePeriodInBlocks()).toString());
        console.log("Deploy changer smart contract", coinPairPrice.address, new_val.toString());
        return await artifacts.require('CoinPairPriceValidPricePeriodInBlocksChange').new(coinPairPrice.address, new_val);
    });
    console.log("validPricePeriodInBlocks  pos:", (await coinPairPrice.validPricePeriodInBlocks()).toString());
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
