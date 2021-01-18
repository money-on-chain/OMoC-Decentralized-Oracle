'use strict';
const helpers = require('@moc/shared/lib/helpers');
const Web3 = require('web3');

async function deploy({ config, ozParams, governor, token }) {
    const CoinPairPriceFree = artifacts.require('@moc/oracles/CoinPairPriceFree');
    const OracleManagerPairChange = artifacts.require('@moc/oracles/OracleManagerPairChange');
    const infoGetterAddr = helpers.ozGetAddr('@moc/oracles/InfoGetter', ozParams);
    const oracleManagerAddr = helpers.ozGetAddr('@moc/oracles/OracleManager', ozParams);
    const proxyAdmin = await helpers.getProxyAdmin(config, ozParams);

    for (const coin of Object.keys(config.stakingMachine.coinPairs)) {
        const coinPair = Web3.utils.asciiToHex(coin).padEnd(66, '0');
        const coinData = config.stakingMachine.coinPairs[coin];
        const coinPairPriceFree = await helpers.ozAdd('@moc/oracles/CoinPairPriceFree', {
            contractAlias: 'CoinPairPriceFree_' + coin,
            admin: proxyAdmin,
            force: true,
            ...ozParams,
        });
        console.log('coinPairPriceFree: ', coinPairPriceFree.address, 'for coin', coin);
        const coinPairPrice = await helpers.ozAdd('@moc/oracles/CoinPairPrice', {
            methodArgs: [
                governor.address,
                [coinPairPriceFree.address, infoGetterAddr],
                coinPair,
                token.address,
                Web3.utils.toBN(coinData.minOraclesPerRound).toString(),
                Web3.utils.toBN(coinData.maxOraclesPerRound).toString(),
                Web3.utils.toBN(coinData.maxSubscribedOraclesPerRound).toString(),
                Web3.utils.toBN(coinData.roundLockPeriodInSecs).toString(),
                Web3.utils.toBN(coinData.validPricePeriodInBlocks).toString(),
                Web3.utils.toBN(coinData.emergencyPublishingPeriodInBlocks).toString(),
                coinData.bootstrapPrice,
                oracleManagerAddr,
            ],
            contractAlias: 'CoinPairPrice_' + coin,
            admin: proxyAdmin,
            network: ozParams.network,
            txParams: { ...ozParams.txParams, gas: 6000000 },
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
