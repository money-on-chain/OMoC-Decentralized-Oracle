'use strict';
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');

stdout.silent(false);


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

    // Deployed in 3_deploy
    const PriceProviderRegister = artifacts.require('PriceProviderRegister.sol');
    const priceProviderRegister = await PriceProviderRegister.deployed();
    const priceProviderRegisterAddr = priceProviderRegister.address;
    console.log("priceProviderRegisterAddr", priceProviderRegisterAddr);


    const baseMultiplicator = 1;
    const baseDivisor = 1;
    const multiplyByPairs = ["BTCUSD"];
    const divideByPairs = ["RIFBTC"];
    const multiplyBy = await Promise.all(multiplyByPairs.map(x => priceProviderRegister.getContractAddress(web3.utils.fromAscii(x))));
    const divideBy = await Promise.all(divideByPairs.map(x => priceProviderRegister.getContractAddress(web3.utils.fromAscii(x))));

    console.log("coinPairPrice multiply", baseMultiplicator, multiplyByPairs, multiplyBy);
    console.log("coinPairPrice divide", baseDivisor, divideByPairs, divideBy);


    console.log("Deploying CalculatedPriceProvider");
    const CalculatedPriceProvider = artifacts.require("CalculatedPriceProvider");
    await deployer.deploy(CalculatedPriceProvider, baseMultiplicator, multiplyBy, baseDivisor, divideBy);
    const calculatedPriceProvider = await CalculatedPriceProvider.deployed();
    console.log("calculatedPriceProvider: ", calculatedPriceProvider.address);

    console.log("Deploy change contract to add the calculator to the whitelist", governorAddr);
    const CoinPairPriceAddCalculatedPriceProviderChange = artifacts.require("CoinPairPriceAddCalculatedPriceProviderChange");
    const change = await CoinPairPriceAddCalculatedPriceProviderChange.new(calculatedPriceProvider.address,
        [...multiplyBy, ...divideBy]);
    console.log("Whitelist CalculatedCoinPairPrice in", [...multiplyBy, ...divideBy]);
    await governor.executeChange(change.address, {from: governorOwner});


    const coin = "RIFUSD";
    const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');
    console.log("Register coin", coin, 'via governor', governorAddr);
    const PriceProviderRegisterPairChange = artifacts.require("PriceProviderRegisterPairChange");
    const change2 = await PriceProviderRegisterPairChange.new(priceProviderRegisterAddr, coinPair, calculatedPriceProvider.address);
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