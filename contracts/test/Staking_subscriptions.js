/* global artifacts, beforeEach, contract, it */
const helpers = require('./helpers');
const {expect} = require('chai');
const {toWei} = require('web3-utils');

contract('Staking-subscriptions', async (accounts) => {
    const feesAccount = accounts[1];
    const TOKEN_FEES = toWei('100', 'ether');
    const governorOwner = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = toWei('1', 'ether');
    const ORACLE_FEES = toWei('1', 'ether');
    const MAX_SELECTED_ORACLES = 5;
    const MAX_SUBSCRIBED_ORACLES = 10;
    const NUM_ORACLES = 15;

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake: ORACLE_STAKE,
        });
        Object.assign(this, contracts);

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            maxOraclesPerRound: MAX_SELECTED_ORACLES,
            maxSubscribedOraclesPerRound: MAX_SUBSCRIBED_ORACLES,
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

    it('subscription - new', async () => {
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const oracleName = 'oracle-' + i;
            const oracleStake = ORACLE_STAKE + i;
            await this.token.approve(this.staking.address, oracleStake, {from: oracleOwner});
            await this.staking.registerOracle(this.oracles[oracleOwner], oracleName, {
                from: oracleOwner,
            });
            await this.staking.deposit(oracleStake, oracleOwner, {from: oracleOwner});
        }

        const COINPAIR_ID = await this.coinPairPrice.coinPair();

        for (let i = 0; i < MAX_SUBSCRIBED_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            await this.staking.subscribeToCoinPair(COINPAIR_ID, {from: oracleOwner});
            const subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(subscribed).to.be.true;
        }
    });

    it('subscription - replacing low stakes', async () => {
        const COINPAIR_ID = await this.coinPairPrice.coinPair();

        for (let i = MAX_SUBSCRIBED_ORACLES; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const toRemoveOwner = Object.keys(this.oracles)[i - MAX_SUBSCRIBED_ORACLES];

            let subscribed = await this.coinPairPrice.isSubscribed(toRemoveOwner);
            expect(subscribed).to.be.true;
            subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(subscribed).to.be.false;

            await this.staking.subscribeToCoinPair(COINPAIR_ID, {from: oracleOwner});

            subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(subscribed).to.be.true;
            subscribed = await this.coinPairPrice.isSubscribed(toRemoveOwner);
            expect(subscribed).to.be.false;
        }
    });
});
