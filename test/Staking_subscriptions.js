/* global artifacts, beforeEach, contract, it */
const helpers = require('./helpers');
const { expect } = require('chai');
const { toWei, toBN } = require('web3-utils');
const { BN } = require('@openzeppelin/test-helpers');

contract('Staking-subscriptions', async (accounts) => {
    const feesAccount = accounts[1];
    const mocAccount = accounts[2];
    const governorOwner = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = toBN(toWei('1', 'ether'));
    const ORACLE_FEES = toBN(toWei('1', 'ether'));
    const MIN_SELECTED_ORACLES = 3;
    const MAX_SELECTED_ORACLES = 5;
    const MAX_SUBSCRIBED_ORACLES = 10;
    const NUM_ORACLES = 15;
    const MAX_STAKE = ORACLE_STAKE.mul(new BN(NUM_ORACLES)).mul(new BN(2));

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake: ORACLE_STAKE,
        });
        Object.assign(this, contracts);

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            minOraclesPerRound: MIN_SELECTED_ORACLES,
            maxOraclesPerRound: MAX_SELECTED_ORACLES,
            maxSubscribedOraclesPerRound: MAX_SUBSCRIBED_ORACLES,
            whitelist: [governorOwner],
        });

        await this.governor.mint(this.token.address, mocAccount, MAX_STAKE);

        this.oracles = {};
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = await helpers.newUnlockedAccount();
            const oracle = await helpers.newUnlockedAccount();
            this.oracles[oracleOwner] = oracle;
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
            const oracleStake = ORACLE_STAKE.add(new BN(i));
            await this.token.transfer(oracleOwner, oracleStake, { from: mocAccount });
            await this.token.approve(this.staking.address, oracleStake, { from: oracleOwner });
            await this.staking.registerOracle(this.oracles[oracleOwner], oracleName, {
                from: oracleOwner,
            });
            await this.staking.deposit(oracleStake, oracleOwner, { from: oracleOwner });
        }

        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();

        let roundFull = await this.coinPairPrice.isRoundFull();
        expect(roundFull).to.be.false;

        for (let i = 0; i < MAX_SUBSCRIBED_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            await this.staking.subscribeToCoinPair(COINPAIR_ID, { from: oracleOwner });
            const subscribed = await this.staking.isSubscribed(oracleOwner, COINPAIR_ID);
            expect(subscribed).to.be.true;
        }

        roundFull = await this.coinPairPrice.isRoundFull();
        expect(roundFull).to.be.true;
    });

    it('subscription - replacing low stakes', async () => {
        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();

        for (let i = MAX_SUBSCRIBED_ORACLES; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const toRemoveOwner = Object.keys(this.oracles)[i - MAX_SUBSCRIBED_ORACLES];

            let subscribed = await this.coinPairPrice.isSubscribed(toRemoveOwner);
            expect(subscribed).to.be.true;
            subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(subscribed).to.be.false;

            await this.staking.subscribeToCoinPair(COINPAIR_ID, { from: oracleOwner });

            subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(subscribed).to.be.true;
            subscribed = await this.coinPairPrice.isSubscribed(toRemoveOwner);
            expect(subscribed).to.be.false;
        }
    });

    it('removing oracle', async () => {
        const oracleOwner = Object.keys(this.oracles)[0];
        const canRemove = await this.staking.canRemoveOracle(oracleOwner);
        expect(canRemove).to.be.true;
        await this.staking.removeOracle({ from: oracleOwner });
    });

    it('change oracle url', async () => {
        const oracleOwner = Object.keys(this.oracles)[1];
        const { internetName: oldURL } = await this.oracleMgr.getOracleRegistrationInfo(
            oracleOwner,
        );
        const newURL = 'https://example.org/newURL';
        expect(oldURL).to.not.equal(newURL);
        await this.staking.setOracleName(newURL, { from: oracleOwner });
        const { internetName: updatedURL } = await this.oracleMgr.getOracleRegistrationInfo(
            oracleOwner,
        );
        expect(updatedURL).to.equal(newURL);
    });
});
