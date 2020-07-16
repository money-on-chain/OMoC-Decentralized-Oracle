'use strict';
const helpers = require("./helpers");
const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');

stdout.silent(false);


async function deploy(deployer, networkName, accounts) {
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });

    // Deployed in 3_deploy
    const OracleManager = artifacts.require('OracleManager.sol');
    const oracleManager = await OracleManager.deployed();
    const oracleManagerAddr = oracleManager.address;
    console.log("oracleManagerAddr", oracleManagerAddr);

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

    console.log("Create PriceProviderRegister");
    await scripts.add({contractsData: [{name: "PriceProviderRegister", alias: "PriceProviderRegister"}]});
    // Give more gas!!!
    await scripts.push({network, txParams: {...txParams}, force: true});
    const priceProviderRegister = await scripts.create({
        methodName: 'initialize',
        methodArgs: [governorAddr],
        admin: proxyAdminAddr,
        contractAlias: "PriceProviderRegister",
        network,
        txParams
    });
    console.log("PriceProviderRegister: ", priceProviderRegister.options.address, 'proxyAdmin', proxyAdminAddr);

    console.log("Register the OracleManager coinpairs in price provider register by gobernanza", governorAddr);
    const ChangeContract = artifacts.require("PriceProviderOracleManagerRegisterPairChange");
    const change = await ChangeContract.new(priceProviderRegister.options.address, oracleManagerAddr);
    await governor.executeChange(change.address, {from: governorOwner});
}

async function truffle_main(deployer, networkName, accounts) {
    if (helpers.is_test()) return;
    const {network, txParams} = await ConfigManager.initNetworkConfiguration({
        network: networkName,
        from: accounts[0]
    });
    await deploy(deployer, networkName, accounts);
    console.log("MIGRATIONS DONE!!!");
}

// FOR TRUFFLE
module.exports = truffle_main