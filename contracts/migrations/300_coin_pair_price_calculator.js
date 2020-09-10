'use strict';
const helpers = require('@moc/shared/lib/helpers');

async function deploy({config, ozParams, governor}) {
    const coin = 'RIFUSD';
    const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');

    console.log('Deploy a CoinPairPriceFree for', coin);
    const coinPairPriceFree = await helpers.ozAdd('@moc/oracles/CoinPairPriceFree', {
        contractAlias: 'CoinPairPriceFree_' + coin,
        admin: await helpers.getProxyAdmin(config, ozParams),
        force: true,
        ...ozParams,
    });
    console.log('coinPairPriceFree: ', coinPairPriceFree.address, 'for coin', coin);

    const priceProviderRegisterAddr = await helpers.ozGetAddr(
        '@moc/oracles/PriceProviderRegister',
        ozParams,
    );
    const priceProviderRegister = await artifacts
        .require('@moc/oracles/PriceProviderRegister')
        .at(priceProviderRegisterAddr);
    console.log('priceProviderRegisterAddr', priceProviderRegisterAddr);

    console.log('Deploying CalculatedPriceProvider');
    const baseMultiplicator = '1';
    const baseDivisor = web3.utils.toBN(10 ** 18).toString();
    const multiplyByPairs = ['BTCUSD', 'RIFBTC'];
    const divideByPairs = [];
    const multiplyBy = await Promise.all(
        multiplyByPairs.map((x) =>
            priceProviderRegister.getContractAddress(web3.utils.fromAscii(x)),
        ),
    );
    const divideBy = await Promise.all(
        divideByPairs.map((x) => priceProviderRegister.getContractAddress(web3.utils.fromAscii(x))),
    );
    console.log('coinPairPrice multiply', baseMultiplicator, multiplyByPairs, multiplyBy);
    console.log('coinPairPrice divide', baseDivisor, divideByPairs, divideBy);

    const calculatedPriceProvider = await helpers.ozAdd('@moc/oracles/CalculatedPriceProvider', {
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
    const CoinPairPriceFree = artifacts.require('@moc/oracles/CoinPairPriceFree');
    const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.address);
    await cpfcall.initialize(calculatedPriceProvider.address);

    console.log('Deploy change contract to add the calculator to the whitelist');
    const CoinPairPriceAddCalculatedPriceProviderChange = artifacts.require(
        'CoinPairPriceAddCalculatedPriceProviderChange',
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

    console.log('Register coin', coin, 'via governor', config.governorAddr);
    const PriceProviderRegisterPairChange = artifacts.require(
        '@moc/oracles/PriceProviderRegisterPairChange',
    );
    const change2 = await PriceProviderRegisterPairChange.new(
        priceProviderRegisterAddr,
        coinPair,
        calculatedPriceProvider.address,
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
module.exports = helpers.truffleOZMain(deploy);
