'use strict';
const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');
const Web3 = require('web3');

async function deploy({config, ozParams, governor}) {
    const coin = 'RIFUSD';
    const coinPair = Web3.utils.asciiToHex(coin).padEnd(66, '0');

    console.log('Deploy a CoinPairPriceFree for', coin);
    const coinPairPriceFree = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/CoinPairPriceFree', {
        contractAlias: 'CoinPairPriceFree_' + coin,
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        ...ozParams,
    });
    console.log('coinPairPriceFree: ', coinPairPriceFree.address, 'for coin', coin);

    const priceProviderRegisterAddr = await helpers.ozGetAddr(
        '@money-on-chain/omoc-decentralized-oracle/PriceProviderRegister',
        ozParams,
    );
    const priceProviderRegister = await artifacts
        .require('@money-on-chain/omoc-decentralized-oracle/PriceProviderRegister')
        .at(priceProviderRegisterAddr);
    console.log('priceProviderRegisterAddr', priceProviderRegisterAddr);

    console.log('Deploying CalculatedPriceProvider');
    const baseMultiplicator = '1';
    const baseDivisor = Web3.utils.toBN(10 ** 18).toString();
    const multiplyByPairs = ['BTCUSD', 'RIFBTC'];
    const divideByPairs = [];
    const multiplyBy = await Promise.all(
        multiplyByPairs.map((x) =>
            priceProviderRegister.getContractAddress(Web3.utils.fromAscii(x)),
        ),
    );
    const divideBy = await Promise.all(
        divideByPairs.map((x) => priceProviderRegister.getContractAddress(Web3.utils.fromAscii(x))),
    );
    console.log('coinPairPrice multiply', baseMultiplicator, multiplyByPairs, multiplyBy);
    console.log('coinPairPrice divide', baseDivisor, divideByPairs, divideBy);

    const calculatedPriceProvider = await helpers.ozAdd('@money-on-chain/omoc-decentralized-oracle/CalculatedPriceProvider', {
        methodArgs: [
            governor.address,
            [coinPairPriceFree.address],
            baseMultiplicator,
            multiplyBy,
            baseDivisor,
            divideBy,
        ],
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        network: ozParams.network,
        txParams: {...ozParams.txParams, gas: 1800000},
    });
    console.log('calculatedPriceProvider: ', calculatedPriceProvider.address);

    console.log('Initialize coinpair price free for', coin);
    const CoinPairPriceFree = artifacts.require('@money-on-chain/omoc-decentralized-oracle/CoinPairPriceFree');
    const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.address);
    await cpfcall.initialize(calculatedPriceProvider.address);

    console.log('Deploy change contract to add the calculator to the whitelist');
    const CoinPairPriceAddCalculatedPriceProviderChange = artifacts.require(
        '@money-on-chain/omoc-decentralized-oracle/CoinPairPriceAddCalculatedPriceProviderChange',
    );
    const change1 = await CoinPairPriceAddCalculatedPriceProviderChange.new(
        calculatedPriceProvider.address,
        [...multiplyBy, ...divideBy],
    );
    console.log('Whitelist CalculatedCoinPairPrice in', [...multiplyBy, ...divideBy]);
    console.log(
        'Whitelist CalculatedCoinPairPrice via governor',
        governor.address,
        'coin',
        coin,
        'change contract addr',
        change1.address,
    );
    await governor.executeChange(change1.address);

    console.log(
        'Register coin',
        coin,
        'via governor',
        governor.address,
        'params',
        priceProviderRegisterAddr,
        coinPair,
        calculatedPriceProvider.address,
    );
    const PriceProviderRegisterPairChange = artifacts.require(
        '@money-on-chain/omoc-decentralized-oracle/PriceProviderRegisterPairChange',
    );
    const change2 = await PriceProviderRegisterPairChange.new(
        priceProviderRegisterAddr,
        coinPair,
        calculatedPriceProvider.address,
        {gas: 3000000},
    );
    console.log(
        'Register coin via governor',
        governor.address,
        'coin',
        coin,
        'change contract addr',
        change2.address,
    );
    await governor.executeChange(change2.address);
}

// FOR TRUFFLE
module.exports = helpers.truffleOZMain(artifacts, deploy);
