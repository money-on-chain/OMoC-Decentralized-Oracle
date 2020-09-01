/* global artifacts, beforeEach, contract, it */
const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toWei} = require('web3-utils');

contract('Staking-withdraw', async (accounts) => {
    const feesAccount = accounts[1];
    const TOKEN_FEES = toWei('100', 'ether');
    const governorOwner = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = toWei('1', 'ether');
    const ORACLE_FEES = toWei('1', 'ether');
    const NUM_SELECTED_ORACLES = 10;
    const NUM_ORACLES = 15;

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake: ORACLE_STAKE,
        });
        Object.assign(this, contracts);

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            maxOraclesPerRound: NUM_SELECTED_ORACLES,
            whitelist: [governorOwner],
        });

        await this.governor.mint(this.token.address, feesAccount, TOKEN_FEES);

        this.oracles = {};
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = await helpers.newUnlockedAccount();
            const oracle = await helpers.newUnlockedAccount();
            const oracleStake = ORACLE_STAKE + i;
            this.oracles[oracleOwner] = oracle;
            await this.governor.mint(this.token.address, oracleOwner, oracleStake);
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracleOwner,
                value: ORACLE_FEES,
            });
        }
    });

    it('subscription', async () => {
        const COINPAIR_ID = await this.coinPairPrice.coinPair();
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const oracleName = 'oracle-' + i;
            const oracleStake = ORACLE_STAKE + i;
            await this.token.approve(this.staking.address, oracleStake, {from: oracleOwner});
            await this.staking.registerOracle(this.oracles[oracleOwner], oracleName, {
                from: oracleOwner,
            });
            await this.staking.deposit(oracleStake, oracleOwner, {from: oracleOwner});
            await this.staking.subscribeToCoinPair(COINPAIR_ID, {from: oracleOwner});
        }

        const {selectedOracles} = await this.coinPairPrice.getRoundInfo();
        expect(selectedOracles.length).to.equal(NUM_SELECTED_ORACLES);

        for (let i = 0; i < NUM_SELECTED_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
            const subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(selected).to.be.true;
            expect(subscribed).to.be.true;
        }

        for (let i = NUM_SELECTED_ORACLES; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
            const subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(selected).to.be.false;
            expect(subscribed).to.be.true;
        }
    });

    it('withdraw', async () => {
        const oracleOwner = Object.keys(this.oracles)[0];
        let selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
        await this.staking.withdraw(1, {from: oracleOwner});
        selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.false;
        const newSelectedOwner = Object.keys(this.oracles)[NUM_ORACLES - 1];
        const newSelected = await this.coinPairPrice.isOracleInCurrentRound(newSelectedOwner);
        expect(newSelected).to.be.true;
    });
});
