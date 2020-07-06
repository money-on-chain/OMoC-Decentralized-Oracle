'use strict';
const change_helpers = require("./change_helpers");
global.artifacts = artifacts;
global.web3 = web3;
const truffle_data = {artifacts, web3};

async function main() {
    const {coinPairPrice} = await change_helpers.changeUint256Arg(truffle_data, async (new_val, coinPairPrice) => {
        console.log("roundLockPeriodInBlocks pre:", (await coinPairPrice.roundLockPeriodInBlocks()).toString());
        console.log("Deploy changer smart contract", coinPairPrice.address, new_val.toString());
        return await artifacts.require('CoinPairPriceRoundLockPeriodInBlocksChange')
            .new(coinPairPrice.address, new_val, {gas: 4000000});
    });
    console.log("roundLockPeriodInBlocks  pos:", (await coinPairPrice.roundLockPeriodInBlocks()).toString());
}


// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
