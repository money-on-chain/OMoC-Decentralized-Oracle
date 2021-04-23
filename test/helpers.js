const { constants, BN, time, expectEvent } = require('@openzeppelin/test-helpers');
const crypto = require('crypto');
const ethers = require('ethers');

const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

const ADDRESS_ZERO = constants.ZERO_ADDRESS;

async function processEvents(receipt, eventName, eventArgs) {
    expectEvent(receipt, eventName, eventArgs);
}

async function printOracles(oracleManager, coinPair) {
    const cant = await oracleManager.getRegisteredOraclesLen();
    for (let i = 0; i < cant; i++) {
        const oracle = await oracleManager.getRegisteredOracleAtIndex(i);
        const info = await oracleManager.getOracleRegistrationInfo(oracle.ownerAddr);
        const roundInfo = await oracleManager.getOracleRoundInfo(oracle.ownerAddr, coinPair);
        console.log(
            '------------------------------>',
            i,
            coinPair,
            oracle.ownerAddr,
            oracle.oracleAddr,
            oracle.url,
            info.stake.toString(),
            roundInfo.points.toString(),
            await oracleManager.isSubscribed(oracle.ownerAddr, coinPair),
            roundInfo.selectedInCurrentRound,
        );
    }
}

async function getDefaultEncodedMessage(version, coinpair, price, votedOracle, blockNumber) {
    const msg = {
        version,
        coinpair,
        price,
        votedOracle,
        blockNumber,
    };

    // Message size (after header): 148 (32+32+32+20+32)

    const encVersion = web3.eth.abi.encodeParameter('uint256', msg.version).substr(2);
    const encCoinpair = web3.eth.abi
        .encodeParameter('bytes32', web3.utils.asciiToHex(coinpair))
        .substr(2);
    const encPrice = web3.eth.abi.encodeParameter('uint256', msg.price).substr(2);
    const encOracle = msg.votedOracle.substr(2);
    const encBlockNum = web3.eth.abi.encodeParameter('uint256', msg.blockNumber).substr(2);

    const encMsg = '0x' + encVersion + encCoinpair + encPrice + encOracle + encBlockNum;
    // console.log(encMsg);
    // console.log("Length:" , encMsg.length);

    return { msg, encMsg };
}

async function getLatestBlock() {
    return await time.latestBlock();
}

async function mineUntilNextRound(coinpairPrice) {
    console.log('Please wait for round blocks to be mined...');
    const roundInfo = await coinpairPrice.getRoundInfo();
    const target = roundInfo.lockPeriodTimestamp.addn(1);
    const now = await time.latest();
    if (target.gt(now)) {
        await time.increase(target.sub(now));
    }
}

async function mineUntilBlock(target) {
    let latestBlock = await getLatestBlock();
    while (latestBlock.lt(target)) {
        await time.advanceBlock();
        latestBlock = await getLatestBlock();
    }
}

async function mineBlocks(num) {
    const latestBlock = await getLatestBlock();
    const endBlock = latestBlock.add(new BN(num));
    await mineUntilBlock(endBlock);
}

function findEvent(logs, name) {
    return logs.find((log) => log.event === name);
}

async function createGovernor(owner) {
    const Governor = artifacts.require('@money-on-chain/omoc-sc-shared/Governor');
    const OracleManagerPairChange = artifacts.require('OracleManagerPairChange');
    const TestMOCMintChange = artifacts.require('TestMOCMintChange');
    const governor = await Governor.new();
    await governor.initialize(owner);
    return {
        addr: governor.address,
        address: governor.address,
        governor,
        registerCoinPair: async (oracleManagerContract, coinPair, address) => {
            const change = await OracleManagerPairChange.new(
                oracleManagerContract.address,
                coinPair,
                address,
            );
            return await governor.executeChange(change.address, { from: owner });
        },
        mint: async (tokenAddr, addr, quantity) => {
            const change = await TestMOCMintChange.new(tokenAddr, addr, quantity);
            return await governor.executeChange(change.address, { from: owner });
        },
        execute: async (change) => {
            return await governor.executeChange(change.address, { from: owner });
        },
    };
}

function coinPairStr(hex) {
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
        const ch = hex.substr(n, 2);
        if (ch === '0x' || ch === '00') {
            continue;
        }
        str += String.fromCharCode(parseInt(ch, 16));
    }
    return str;
}

function bytes32toBN(pr) {
    pr = pr.replace(/^0x/, '');
    return new BN(pr, 16);
}

async function initCoinpair(
    name,
    {
        governor,
        token,
        oracleMgr,
        whitelist,
        registry,
        maxOraclesPerRound = 10,
        maxSubscribedOraclesPerRound = 30,
        roundLockPeriodInSecs = 60,
        validPricePeriodInBlocks = 3,
        emergencyPublishingPeriodInBlocks = 2,
        bootstrapPrice = '100000000',
    },
) {
    const CoinPairPrice = artifacts.require('CoinPairPrice');
    const ret = await CoinPairPrice.new();
    await ret.initialize(
        governor.addr,
        whitelist,
        web3.utils.asciiToHex(name),
        token.address,
        maxOraclesPerRound,
        maxSubscribedOraclesPerRound,
        roundLockPeriodInSecs,
        validPricePeriodInBlocks,
        emergencyPublishingPeriodInBlocks,
        bootstrapPrice,
        oracleMgr.address,
        registry,
    );
    await governor.registerCoinPair(oracleMgr, web3.utils.asciiToHex(name), ret.address);
    return ret;
}

async function initContracts({
                                 governorOwner,
                                 period = 20,
                                 minSubscriptionStake = (10 ** 18).toString(),
                                 oracleManagerWhitelisted = [],
                                 withdrawLockTime = (60 * 60).toString(),
                                 governor = null,
                                 wList = [],
                             }) {
    const TestMOC = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedERC20');
    const OracleManager = artifacts.require('OracleManager');
    const Supporters = artifacts.require('Supporters');
    const Staking = artifacts.require('Staking');
    // const CoinPairPrice = artifacts.require('CoinPairPrice');
    const MockDelayMachine = artifacts.require('MockDelayMachine');
    const StakingMock = artifacts.require('StakingMock');
    const MockVotingMachine = artifacts.require('MockVotingMachine');
    const Registry = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedRegistry');

    if (governor === null) {
        governor = await createGovernor(governorOwner);
    }
    const token = await TestMOC.new();
    await token.initialize(governor.address);
    const oracleMgr = await OracleManager.new();
    const supporters = await Supporters.new();
    const delayMachine = await MockDelayMachine.new();
    await delayMachine.initialize(governor.address, token.address);
    const staking = await Staking.new();
    const stakingMock = await StakingMock.new();
    const votingMachine = await MockVotingMachine.new();
    const registry = await Registry.new();

    await supporters.initialize(
        governor.address,
        [oracleMgr.address, staking.address],
        token.address,
        period,
    );
    if (wList.length === 0) {
        wList = [staking.address, ...oracleManagerWhitelisted];
    }
    await oracleMgr.initialize(governor.address, minSubscriptionStake, staking.address, wList);
    await staking.initialize(
        governor.address,
        supporters.address,
        oracleMgr.address,
        delayMachine.address,
        [votingMachine.address],
        withdrawLockTime,
    );
    await stakingMock.initialize(staking.address, supporters.address);
    await votingMachine.initialize(staking.address);

    await registry.initialize(governor.address);
    if (governor.execute) { // in the case of fake governor we probably wont require this..
        const MocRegistryAddMinOraclesPerRoundChange = artifacts.require('MocRegistryAddMinOraclesPerRoundChange');
        const change = await MocRegistryAddMinOraclesPerRoundChange.new(registry.address);
        await governor.execute(change, { from: governorOwner });
    } else {
        console.error('WARNING: execution without \'minOraclePerRound\' setup!');
    }

    return {
        governor,
        token,
        oracleMgr,
        supporters,
        delayMachine,
        staking,
        stakingMock,
        votingMachine,
        registry: registry.address,
    };
}

async function newUnlockedAccount() {
    const pass = crypto.randomBytes(20).toString('hex');
    const account = await web3.eth.personal.newAccount(pass);
    await web3.eth.personal.unlockAccount(account, pass, 60000);
    return account;
}

async function publishPrice({ coinPairPrice, coinPairName, price, oracles }) {
    const lastPublicationBlock = await coinPairPrice.getLastPublicationBlock();
    const { msg, encMsg } = await getDefaultEncodedMessage(
        3,
        coinPairName,
        price,
        oracles[0].address,
        lastPublicationBlock.toString(),
    );

    const sigs = [];
    for (let i = 0; i < oracles.length; i++) {
        sigs.push(ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[i].address)));
    }

    const sigV = [];
    const sigR = [];
    const sigS = [];
    for (let j = sigs.length - 1; j >= 0; j--) {
        sigV.push(sigs[j].v);
        sigR.push(sigs[j].r);
        sigS.push(sigs[j].s);
    }

    await coinPairPrice.publishPrice(
        msg.version,
        web3.utils.asciiToHex(coinPairName),
        msg.price,
        msg.votedOracle,
        lastPublicationBlock.toString(),
        sigV,
        sigR,
        sigS,
        { from: oracles[0].address },
    );
}

module.exports = {
    ADDRESS_ONE,
    ADDRESS_ZERO,
    bytes32toBN,
    coinPairStr,
    createGovernor,
    findEvent,
    getDefaultEncodedMessage,
    initContracts,
    initCoinpair,
    getLatestBlock,
    mineBlocks,
    mineUntilBlock,
    mineUntilNextRound,
    printOracles,
    publishPrice,
    newUnlockedAccount,
    processEvents,
};
