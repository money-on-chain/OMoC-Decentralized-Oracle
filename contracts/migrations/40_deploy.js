'use strict';
const helpers = require('./helpers');
const {scripts} = require('@openzeppelin/cli');
const InfoGetter = artifacts.require('InfoGetter.sol');
const OracleManagerPairChange = artifacts.require('OracleManagerPairChange');
const CoinPairPriceFree = artifacts.require('CoinPairPriceFree');

async function deploy(config) {
    // Deployed in 30_info_getter
    const info_getter = await InfoGetter.deployed();
    const info_getter_addr = info_getter.address;
    console.log('infoGetterAddr', info_getter_addr);

    console.log('Deploying TestMOC');
    await scripts.add({contractsData: [{name: 'TestMOC', alias: 'TestMOC'}]});
    await scripts.push({
        network: config.network,
        txParams: {...config.txParams, gas: 3500000},
        force: true,
    });
    const testMOC = await scripts.create({
        methodName: 'initialize',
        methodArgs: [config.governorAddr],
        admin: config.proxyAdminAddr,
        contractAlias: 'TestMOC',
        network: config.network,
        txParams: config.txParams,
    });
    console.log('TestMOC: ', testMOC.options.address);

    console.log('Create Supporters Proxy');
    await scripts.add({contractsData: [{name: 'Supporters', alias: 'Supporters'}]});
    await scripts.push({
        network: config.network,
        txParams: {...config.txParams, gas: 3500000},
        force: true,
    });
    const supporters = await scripts.create({
        admin: config.proxyAdminAddr,
        contractAlias: 'Supporters',
        network: config.network,
        txParams: config.txParams,
    });
    console.log('Supporters: ', supporters.options.address, 'proxyAdmin', config.proxyAdminAddr);

    console.log('Create OraclesManager');
    await scripts.add({contractsData: [{name: 'OracleManager', alias: 'OracleManager'}]});
    // Give more gas!!!
    await scripts.push({
        network: config.network,
        txParams: helpers.is_production() ? {...config.txParams, gas: 4300000} : config.txParams,
        force: true,
    });
    const oracleManager = await scripts.create({
        admin: config.proxyAdminAddr,
        contractAlias: 'OracleManager',
        network: config.network,
        txParams: config.txParams,
    });
    console.log(
        'OracleManager: ',
        oracleManager.options.address,
        'proxyAdmin',
        config.proxyAdminAddr,
    );

    console.log('Create Staking');
    await scripts.add({contractsData: [{name: 'Staking', alias: 'StakingMachine'}]});
    await scripts.push({
        network: config.network,
        txParams: helpers.is_production() ? {...config.txParams, gas: 1800000} : config.txParams,
        force: true,
    });
    const staking = await scripts.create({
        admin: config.proxyAdminAddr,
        contractAlias: 'StakingMachine',
        network: config.network,
        txParams: config.txParams,
    });
    console.log('Staking: ', staking.options.address, 'proxyAdmin', config.proxyAdminAddr);

    console.log('Create MockDelayMachine');
    await scripts.add({contractsData: [{name: 'MockDelayMachine', alias: 'MockDelayMachine'}]});
    await scripts.push({
        network: config.network,
        txParams: helpers.is_production() ? {...config.txParams, gas: 1800000} : config.txParams,
        force: true,
    });
    const mockDelayMachine = await scripts.create({
        admin: config.proxyAdminAddr,
        contractAlias: 'MockDelayMachine',
        network: config.network,
        txParams: config.txParams,
    });
    console.log(
        'MockDelayMachine: ',
        mockDelayMachine.options.address,
        'proxyAdmin',
        config.proxyAdminAddr,
    );

    console.log('Initialize supporters', 'governor', config.governorAddr);
    const scall = await artifacts.require('Supporters').at(supporters.options.address);
    await scall.initialize(
        config.governorAddr,
        [oracleManager.options.address],
        testMOC.options.address,
        config.supportersEarnPeriodInBlocks,
    );

    console.log('Initialize OracleManager', 'governor', config.governorAddr);
    const omcall = await artifacts.require('OracleManager').at(oracleManager.options.address);
    await omcall.initialize(
        config.governorAddr,
        parseInt(config.minOracleOwnerStake),
        supporters.options.address,
    );

    console.log('Initialize Mock Delay Machine', 'governor', config.governorAddr);
    const dmcall = await artifacts.require('MockDelayMachine').at(mockDelayMachine.options.address);
    await dmcall.initialize(config.governorAddr, testMOC.options.address);

    console.log('Initialize Staking Machine', 'governor', config.governorAddr);
    const smcall = await artifacts.require('Staking').at(staking.options.address);
    await smcall.initialize(
        config.governorAddr,
        supporters.options.address,
        oracleManager.options.address,
        mockDelayMachine.options.address,
    );

    for (let i = 0; i < config.CurrencyPair.length; i++) {
        const coin = config.CurrencyPair[i];
        const coinPair = web3.utils.asciiToHex(coin).padEnd(66, '0');

        await scripts.add({
            contractsData: [{name: 'CoinPairPriceFree', alias: 'CoinPairPriceFree'}],
        });
        await scripts.push({network: config.network, txParams: config.txParams});
        const coinPairPriceFree = await scripts.create({
            admin: config.proxyAdminAddr,
            contractAlias: 'CoinPairPriceFree',
            network: config.network,
            txParams: config.txParams,
        });
        console.log(
            'coinPairPriceFree address: ',
            coinPairPriceFree.options.address,
            'for coin',
            coinPair,
            'proxyAdmin',
            config.proxyAdminAddr,
        );

        const alias = 'CoinPairPrice_' + coin;
        await scripts.add({contractsData: [{name: 'CoinPairPrice', alias: alias}]});
        // MORE GAS!!!
        await scripts.push({
            network: config.network,
            txParams: {...config.txParams, gas: 4000000},
            force: true,
        });
        const coinPairPrice = await scripts.create({
            admin: config.proxyAdminAddr,
            contractAlias: alias,
            methodName: 'initialize',
            methodArgs: [
                config.governorAddr,
                [coinPairPriceFree.options.address, info_getter_addr],
                coinPair,
                testMOC.options.address,
                parseInt(config.maxOraclesPerRound[i]),
                parseInt(config.roundLockPeriodInSecs[i]),
                parseInt(config.validPricePeriodInBlocks[i]),
                parseInt(config.emergencyPublishingPeriodInBlocks[i]),
                config.bootstrapPrice[i],
                oracleManager.options.address,
            ],
            network: config.network,
            txParams: config.txParams,
        });
        console.log(
            'coinPairPrice address: ' + coinPairPrice.options.address,
            'governor',
            config.governorAddr,
            'proxyAdmin',
            config.proxyAdminAddr,
        );

        console.log('Initialize coinpair price free for', coin);
        const cpfcall = await CoinPairPriceFree.at(coinPairPriceFree.options.address);
        await cpfcall.initialize(coinPairPrice.options.address);

        console.log('Register coin', coin, 'via governor', config.governorAddr);
        const change = await OracleManagerPairChange.new(
            oracleManager.options.address,
            coinPair,
            coinPairPrice.options.address,
        );
        console.log(
            'Register coin via governor',
            config.governorAddr,
            'coin',
            coin,
            'change contract addr',
            change.address,
        );
        await config.executeChange(change.address);
    }
}

// FOR TRUFFLE
module.exports = helpers.truffle_main(artifacts, deploy);
