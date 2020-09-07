'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    const CoinPairPriceFree = artifacts.require('CoinPairPriceFree');
    const OracleManagerPairChange = artifacts.require('OracleManagerPairChange');
    const testMOCAddr = helpers.ozGetAddr('TestMOC', ozParams);
    const infoGetterAddr = helpers.ozGetAddr('InfoGetter', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('OracleManager', ozParams);
    const proxyAdmin = await helpers.getProxyAdmin(config, ozParams);

    for (const coin of Object.keys(config.stakingMachine.coinPairs)) {
        const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');
        const coinData = config.stakingMachine.coinPairs[coin];
        const coinPairPriceFree = await helpers.ozAdd('CoinPairPriceFree', {
            contractAlias: 'CoinPairPriceFree_' + coin,
            admin: proxyAdmin,
            force: true,
            ...ozParams,
        });
        console.log('coinPairPriceFree: ', coinPairPriceFree.address, 'for coin', coin);

        const coinPairPrice = await helpers.ozAdd('CoinPairPrice', {
            methodArgs: [
                governor.address,
                [coinPairPriceFree.address, infoGetterAddr],
                coinPair,
                testMOCAddr,
                parseInt(coinData.maxOraclesPerRound),
                parseInt(coinData.maxSubscribedOraclesPerRound),
                parseInt(coinData.roundLockPeriodInSecs),
                parseInt(coinData.validPricePeriodInBlocks),
                parseInt(coinData.emergencyPublishingPeriodInBlocks),
                coinData.bootstrapPrice,
                oracleManagerAddr,
            ],
            contractAlias: 'CoinPairPrice_' + coin,
            admin: proxyAdmin,
            network: ozParams.network,
            txParams: {...ozParams.txParams, gas: 6000000},
            force: true,
        });
        console.log('coinPairPrice address: ' + coinPairPrice.address);

        console.log('Initialize coinpair price free for', coin);
        const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.address);
        await cpfcall.initialize(coinPairPrice.address);

        console.log('Register coin', coin, 'via governor', governor.address);
        const change = await OracleManagerPairChange.new(
            oracleManagerAddr,
            coinPair,
            coinPairPrice.address,
        );
        console.log(
            'Register coin via governor',
            governor.address,
            'coin',
            coin,
            'change contract addr',
            change.address,
        );
        await governor.executeChange(change.address);
    }
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(deploy);
