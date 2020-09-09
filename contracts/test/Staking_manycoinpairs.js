/* global artifacts, beforeEach, contract, it */
const helpers = require('./helpers');
const {BN} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toWei, toBN, padRight, toHex} = require('web3-utils');

function makeRange(num) {
    const r = [];
    for (let i = 0; i < num; i += 1) {
        r.push(i);
    }
    return r;
}

contract('Staking-withdraw with many coin pairs', async (accounts) => {
    const feesAccount = accounts[1];
    const TOKEN_FEES = toBN(toWei('100', 'ether'));
    const governorOwner = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = toBN(toWei('1', 'ether'));
    const ORACLE_FEES = toBN(toWei('1', 'ether'));
    const MAX_SELECTED_ORACLES = 10;
    const NUM_SUBSCRIBED_ORACLES = 30;
    const NUM_ORACLES = 30;
    // Just a hack to run: for i in 1 2 3 4 5; do COINPAIRS=$i npm test test/Staking_manycoinpairs.js | grep withdraw; done
    const NUM_COINPAIR = process.env.COINPAIRS || 4;
    console.log('withdraw COINPAIRS', NUM_COINPAIR);
    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake: ORACLE_STAKE,
        });
        Object.assign(this, contracts);

        const r = makeRange(NUM_COINPAIR);

        this.coinPairs = [];
        for (const i of r) {
            const coinPair = await helpers.initCoinpair(COINPAIR_NAME + i, {
                ...contracts,
                maxOraclesPerRound: MAX_SELECTED_ORACLES,
                maxSubscribedOraclesPerRound: NUM_SUBSCRIBED_ORACLES,
                whitelist: [governorOwner],
            });
            this.coinPairs.push(coinPair);
        }

        await this.governor.mint(this.token.address, feesAccount, TOKEN_FEES);

        this.oracles = {};
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = await helpers.newUnlockedAccount();
            const oracle = await helpers.newUnlockedAccount();
            const oracleStake = ORACLE_STAKE.add(toBN(i));
            this.oracles[oracleOwner] = oracle;
            await this.governor.mint(this.token.address, oracleOwner, oracleStake);
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracleOwner,
                value: ORACLE_FEES,
            });
        }
    });

    it('coinPairs query info', async () => {
        const numCoinPair = await this.staking.getCoinPairCount();
        expect(numCoinPair).to.be.bignumber.equal(new BN(NUM_COINPAIR));

        for (let i = 0; i < NUM_COINPAIR; i += 1) {
            const coinPairId = await this.staking.getCoinPairAtIndex(i);
            expect(coinPairId).to.equal(padRight(toHex(COINPAIR_NAME + i), 64));
            const coinPairAddress = await this.staking.getContractAddress(coinPairId);
            expect(coinPairAddress).to.equal(this.coinPairs[i].address);
            const coinPairIndex = await this.staking.getCoinPairIndex(coinPairId, 0);
            expect(coinPairIndex).to.be.bignumber.equal(new BN(i));
        }
    });

    it('subscription', async () => {
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const oracleName = 'oracle-' + i;
            const oracleStake = ORACLE_STAKE.add(toBN(i));
            await this.token.approve(this.staking.address, oracleStake, {from: oracleOwner});
            await this.staking.registerOracle(this.oracles[oracleOwner], oracleName, {
                from: oracleOwner,
            });
            await this.staking.deposit(oracleStake, oracleOwner, {from: oracleOwner});
            for (const coinPair of this.coinPairs) {
                const COINPAIR_ID = await coinPair.coinPair();
                await this.staking.subscribeToCoinPair(COINPAIR_ID, {from: oracleOwner});
            }
        }

        const coinPair = this.coinPairs[0];
        const {selectedOracles} = await coinPair.getRoundInfo();
        expect(selectedOracles.length).to.equal(MAX_SELECTED_ORACLES);
    });

    it('withdraw', async () => {
        const coinPair = this.coinPairs[0];
        const oracleOwner = Object.keys(this.oracles)[0];
        let selected = await coinPair.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
        await this.staking.withdraw(1, {from: oracleOwner});
        selected = await coinPair.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.false;
        const newSelectedOwner = Object.keys(this.oracles)[NUM_ORACLES - 1];
        const newSelected = await coinPair.isOracleInCurrentRound(newSelectedOwner);
        expect(newSelected).to.be.true;
    });
});
