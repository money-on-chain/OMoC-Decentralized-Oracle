'use strict';

const {toBN, toWei} = require('web3-utils');


const STAGING_ORACLES_TO_REGISTER = [
    {
        addr: "0xF6A2fe11415cEEC12B59D9BC8d37AAF9DDA60B32",
        name: "http://167.172.106.249:5000",
        quantity: toBN(toWei("20", "ether")),
        oracleCoinPairFilter: ["BTCUSD"]
    },
    {
        addr: "0xBc6D08Ecd1F17c5f7aE16c92CEB8d9B5f6bcbC54",
        name: "http://167.172.106.249:5001",
        quantity: toBN(toWei("25", "ether")),
        oracleCoinPairFilter: ["RIFBTC"]
    },
    {
        addr: "0x8b7EEF66c1BB20f550b79E4891CcC6a06F7f4F6d",
        name: "http://167.172.106.249:5002",
        quantity: toBN(toWei("28", "ether")),
        oracleCoinPairFilter: ["BTCUSD", "RIFBTC"]
    },
    {
        addr: "0xff49426EE621FCF9928FfDBd163fBC13fA36f465",
        name: "http://184.169.253.215:5000",
        quantity: toBN(toWei("10", "ether")),
        oracleCoinPairFilter: ["BTCUSD"]
    },
    {
        addr: "0x3ef6eFadE0C6F1AC81779F5f66142462b64D2285",
        name: "http://184.169.253.215:5001",
        quantity: toBN(toWei("35", "ether")),
        oracleCoinPairFilter: ["RIFBTC"]
    },
    {
        addr: "0xd761CC1ceB991631d431F6dDE54F07828f2E61d2",
        name: "http://184.169.253.215:5002",
        quantity: toBN(toWei("5", "ether")),
        oracleCoinPairFilter: ["BTCUSD", "RIFBTC"]
    },
];

const TEST_ORACLES_TO_REGISTER = [
    {
        addr: "0x610Bb1573d1046FCb8A70Bbbd395754cD57C2b60",
        name: "http://localhost:5000",
        quantity: toBN(toWei("10", "ether")),
        oracleCoinPairFilter: ["BTCUSD"]
    },
    {
        addr: "0x855FA758c77D68a04990E992aA4dcdeF899F654A",
        name: "http://localhost:5001",
        quantity: toBN(toWei("20", "ether")),
        oracleCoinPairFilter: ["RIFBTC"]
    },
    {
        addr: "0xfA2435Eacf10Ca62ae6787ba2fB044f8733Ee843",
        name: "http://localhost:5002",
        quantity: toBN(toWei("20", "ether")),
        oracleCoinPairFilter: ["BTCUSD", "RIFBTC"]
    },
    {
        addr: "0x64E078A8Aa15A41B85890265648e965De686bAE6",
        name: "http://localhost:5003",
        quantity: toBN(toWei("30", "ether")),
        oracleCoinPairFilter: ["BTCUSD", "RIFBTC"]
    }
    /*  ,{
            addr: "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598",
            name: "http://localhost:5004",
            quantity: toBN(toWei("35", "ether")),
            oracleCoinPairFilter: ["BTCUSD","RIFBTC"]
        }*/
];

const ORACLES_TO_REGISTER_BY_NETWORK = {
    31: STAGING_ORACLES_TO_REGISTER,
    12341234: TEST_ORACLES_TO_REGISTER,
}

module.exports = ORACLES_TO_REGISTER_BY_NETWORK;