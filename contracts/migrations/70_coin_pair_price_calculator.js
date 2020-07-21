'use strict';
const helpers = require("./helpers");
const {scripts} = require('@openzeppelin/cli');

async function deploy(config) {

    const coin = "RIFUSD";
    const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');
    // Deployed in 60_price_provider_registry
    const PriceProviderRegister = artifacts.require('PriceProviderRegister.sol');
    const priceProviderRegister = await PriceProviderRegister.deployed();
    const priceProviderRegisterAddr = priceProviderRegister.address;
    console.log("priceProviderRegisterAddr", priceProviderRegisterAddr);


    console.log("Deploy a CoinPairPriceFree");
    await scripts.add({contractsData: [{name: "CoinPairPriceFree", alias: "CoinPairPriceFree"}]});
    await scripts.push({network: config.network, txParams: config.txParams});
    const coinPairPriceFree = await scripts.create({
        admin: config.proxyAdminAddr,
        contractAlias: "CoinPairPriceFree",
        network: config.network,
        txParams: config.txParams
    });
    console.log("coinPairPriceFree address: ", coinPairPriceFree.options.address, 'for coin', coin,
        'proxyAdmin', config.proxyAdminAddr);


    console.log("Deploying CalculatedPriceProvider");
    const baseMultiplicator = "1";
    const baseDivisor = (web3.utils.toBN(10 ** 18)).toString();
    const multiplyByPairs = ["BTCUSD", "RIFBTC"];
    const divideByPairs = [];
    const multiplyBy = await Promise.all(multiplyByPairs.map(x => priceProviderRegister.getContractAddress(web3.utils.fromAscii(x))));
    const divideBy = await Promise.all(divideByPairs.map(x => priceProviderRegister.getContractAddress(web3.utils.fromAscii(x))));
    console.log("coinPairPrice multiply", baseMultiplicator, multiplyByPairs, multiplyBy);
    console.log("coinPairPrice divide", baseDivisor, divideByPairs, divideBy);
    await scripts.add({
        contractsData: [{
            name: "CalculatedPriceProvider",
            alias: "CalculatedPriceProvider"
        }]
    });
    await scripts.push({network: config.network, txParams: {...config.txParams, gas: 1800000}, force: true});
    const calculatedPriceProvider = await scripts.create({
        methodName: 'initialize',
        methodArgs: [config.governorAddr, [coinPairPriceFree.options.address],
            baseMultiplicator,
            multiplyBy, baseDivisor, divideBy],
        admin: config.proxyAdminAddr,
        contractAlias: "CalculatedPriceProvider",
        network: config.network,
        txParams: config.txParams
    });
    console.log("calculatedPriceProvider: ", calculatedPriceProvider.options.address);


    console.log("Initialize coinpair price free for", coin);
    const CoinPairPriceFree = artifacts.require('CoinPairPriceFree.sol');
    const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.options.address);
    await cpfcall.initialize(calculatedPriceProvider.options.address);


    console.log("Deploy change contract to add the calculator to the whitelist", config.governorAddr);
    const CoinPairPriceAddCalculatedPriceProviderChange = artifacts.require("CoinPairPriceAddCalculatedPriceProviderChange");
    const change1 = await CoinPairPriceAddCalculatedPriceProviderChange.new(calculatedPriceProvider.options.address,
        [...multiplyBy, ...divideBy]);
    console.log("Whitelist CalculatedCoinPairPrice in", [...multiplyBy, ...divideBy]);
    console.log("Whitelist CalculatedCoinPairPrice via governor", config.governorAddr, 'coin', coin,
        "change contract addr", change1.address);
    await config.executeChange(change1.address);


    console.log("Register coin", coin, 'via governor', config.governorAddr);
    const PriceProviderRegisterPairChange = artifacts.require("PriceProviderRegisterPairChange");
    const change2 = await PriceProviderRegisterPairChange.new(priceProviderRegisterAddr, coinPair, calculatedPriceProvider.address);
    console.log("Register coin via governor", config.governorAddr, 'coin', coin, "change contract addr", change2.address);
    await config.executeChange(change2.address);

}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy)