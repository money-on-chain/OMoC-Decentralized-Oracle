'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');

stdout.silent(false);

const coin = "RIFUSD";
const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');

async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });


    // Deployed in 20_moc_gobernanza
    const governorOwner = accounts[0];
    const Governor = artifacts.require('Governor.sol');
    const governor = await Governor.deployed();
    const governorAddr = governor.address;
    console.log("governorAddr", governorAddr, 'owner', governorOwner);
    // We will use the project's proxy admin as upgradeability admin of this instance
    const networkFile = new files.NetworkFile(
        new files.ProjectFile(),
        network
    );
    const proxyAdminAddr = networkFile.proxyAdminAddress;
    console.log("proxyAdminAddr ", proxyAdminAddr);

    // Deployed in 60_price_provider_registry
    const PriceProviderRegister = artifacts.require('PriceProviderRegister.sol');
    const priceProviderRegister = await PriceProviderRegister.deployed();
    const priceProviderRegisterAddr = priceProviderRegister.address;
    console.log("priceProviderRegisterAddr", priceProviderRegisterAddr);


    console.log("Deploy a CoinPairPriceFree");
    await scripts.add({contractsData: [{name: "CoinPairPriceFree", alias: "CoinPairPriceFree"}]});
    await scripts.push({network, txParams});
    const coinPairPriceFree = await scripts.create({
        admin: proxyAdminAddr,
        contractAlias: "CoinPairPriceFree",
        network,
        txParams
    });
    console.log("coinPairPriceFree address: ", coinPairPriceFree.options.address, 'for coin', coin, 'proxyAdmin', proxyAdminAddr);


    console.log("Deploying CalculatedPriceProviderWhitelisted");
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
            name: "CalculatedPriceProviderWhitelisted",
            alias: "CalculatedPriceProviderWhitelisted"
        }]
    });
    await scripts.push({network, txParams: {...txParams, gas: 3000000}});
    const calculatedPriceProviderWhitelisted = await scripts.create({
        methodName: 'initialize',
        methodArgs: [governorAddr, [coinPairPriceFree.options.address], baseMultiplicator, multiplyBy, baseDivisor, divideBy],
        admin: proxyAdminAddr,
        contractAlias: "CalculatedPriceProviderWhitelisted",
        network,
        txParams
    });
    console.log("calculatedPriceProviderWhitelisted: ", calculatedPriceProviderWhitelisted.options.address);


    console.log("Initialize coinpair price free for", coin);
    const CoinPairPriceFree = artifacts.require('CoinPairPriceFree.sol');
    const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.options.address);
    await cpfcall.initialize(calculatedPriceProviderWhitelisted.options.address);


    console.log("Deploy change contract to add the calculator to the whitelist", governorAddr);
    const CoinPairPriceAddCalculatedPriceProviderChange = artifacts.require("CoinPairPriceAddCalculatedPriceProviderChange");
    const change = await CoinPairPriceAddCalculatedPriceProviderChange.new(calculatedPriceProviderWhitelisted.options.address,
        [...multiplyBy, ...divideBy]);
    console.log("Whitelist CalculatedCoinPairPrice in", [...multiplyBy, ...divideBy]);
    await governor.executeChange(change.address, {from: governorOwner});


    console.log("Register coin", coin, 'via governor', governorAddr);
    const PriceProviderRegisterPairChange = artifacts.require("PriceProviderRegisterPairChange");
    const change2 = await PriceProviderRegisterPairChange.new(priceProviderRegisterAddr, coinPair, calculatedPriceProviderWhitelisted.address);
    console.log("Register coin via governor", governorAddr, 'coin', coin, "change contract addr", change2.address, 'governor owner', governorOwner);
    await governor.executeChange(change2.address, {from: governorOwner});

}

async function truffle_main(deployer, networkName, accounts) {
    // don't run migrations for tests, all tests create their own environment.
    if (process.argv.some(x => x.indexOf('test') >= 0)
        || process.argv.some(x => x.indexOf('coverage') >= 0)) {
        console.log("SKIPING MIGRATIONS FOR TEST");
        return;
    }
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });
    await deploy(deployer, networkName, accounts);
    console.log("MIGRATIONS DONE!!!");
}

// FOR TRUFFLE
module.exports = truffle_main