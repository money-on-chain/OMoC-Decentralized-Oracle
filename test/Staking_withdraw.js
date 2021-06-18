/* global contract, it */
const helpers = require('./helpers');
const { BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { toWei, toBN } = require('web3-utils');

contract('Staking-withdraw', async (accounts) => {
    const ORACLE_FEES = toBN(toWei('2', 'ether')).div(new BN(10));
    const ORACLE_STAKE = ORACLE_FEES.div(new BN(10));
    const feesAccount = accounts[0];
    const TOKEN_FEES = toBN(toWei('100', 'ether'));
    const governorOwner = accounts[1];
    const COINPAIR_NAME = 'BTCUSD';
    const MIN_SELECTED_ORACLES = 3;
    const MAX_SELECTED_ORACLES = 10;
    const MAX_SUBSCRIBED_ORACLES = 30;
    const NUM_ORACLES = 30;

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

        await this.governor.mint(this.token.address, feesAccount, TOKEN_FEES);

        this.oracles = {};
        this.owners = [];
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = await helpers.newUnlockedAccount();
            this.owners.push(oracleOwner);
            const oracle = await helpers.newUnlockedAccount();
            const oracleStake = ORACLE_STAKE.add(toBN(NUM_ORACLES - i));
            this.oracles[oracleOwner] = oracle;
            await this.governor.mint(this.token.address, oracleOwner, oracleStake);
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracleOwner,
                value: ORACLE_FEES,
            });
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracle,
                value: ORACLE_FEES,
            });
        }
    });

    it('subscription', async () => {
        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = this.owners[i];
            const oracleName = 'oracle-' + i;
            const oracleStake = ORACLE_STAKE.add(toBN(NUM_ORACLES - i));
            await this.token.approve(this.staking.address, oracleStake, { from: oracleOwner });
            await this.staking.registerOracle(this.oracles[oracleOwner], oracleName, {
                from: oracleOwner,
            });
            await this.staking.deposit(oracleStake, oracleOwner, { from: oracleOwner });
            await this.staking.subscribeToCoinPair(COINPAIR_ID, { from: oracleOwner });
        }

        const { selectedOracles } = await this.coinPairPrice.getRoundInfo();
        expect(selectedOracles.length).to.equal(MAX_SELECTED_ORACLES);

        for (let i = 0; i < MAX_SELECTED_ORACLES; i += 1) {
            const oracleOwner = this.owners[i];
            const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
            const subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(selected).to.be.true;
            expect(subscribed).to.be.true;
        }

        for (let i = MAX_SELECTED_ORACLES; i < NUM_ORACLES; i += 1) {
            const oracleOwner = this.owners[i];
            const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
            const subscribed = await this.coinPairPrice.isSubscribed(oracleOwner);
            expect(selected).to.be.false;
            expect(subscribed).to.be.true;
        }
    });

    it('withdraw and keep in round', async () => {
        const oracleOwner = this.owners[MAX_SELECTED_ORACLES - 1];
        let selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
        await this.staking.withdraw(1, { from: oracleOwner });
        selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
    });

    it('publish price', async () => {
        await this.coinPairPrice.switchRound();

        const oracleOwner = this.owners[MAX_SELECTED_ORACLES - 1];
        const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;

        const signers = [];
        for (let i = 0; i < MAX_SELECTED_ORACLES / 2 + 1; i += 1) {
            const owner = this.owners[MAX_SELECTED_ORACLES - 1 - i];
            signers.push({ address: this.oracles[owner], owner });
        }
        await helpers.publishPrice({
            coinPairPrice: this.coinPairPrice,
            coinPairName: COINPAIR_NAME,
            price: (10 ** 18).toString(),
            oracles: signers,
            publisher: this.oracles[oracleOwner],
        });

        const { points } = await this.coinPairPrice.getOracleRoundInfo(signers[0].owner);
        expect(points).to.be.bignumber.equal(new BN(1));
    });

    it('withdraw and drop from round', async () => {
        const oracleOwner = this.owners[MAX_SELECTED_ORACLES - 1];

        await this.staking.withdraw(1, { from: oracleOwner });
        const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.false;

        const { expirations } = await this.delayMachine.getTransactions(oracleOwner);
        const expirationSecs = expirations[1];
        const stakingLockPeriod = await this.staking.getWithdrawLockTime();
        const { lockPeriodTimestamp } = await this.coinPairPrice.getRoundInfo();
        const currentTime = await time.latest();
        console.log(currentTime.toString(), lockPeriodTimestamp.toString());
        expect(expirationSecs).to.be.bignumber.equal(lockPeriodTimestamp.add(stakingLockPeriod));

        const { points } = await this.coinPairPrice.getOracleRoundInfo(oracleOwner);
        expect(points).to.be.bignumber.equal(new BN(0));
    });

    it('new selected oracle can publish', async () => {
        const newOracleOwner = this.owners[MAX_SELECTED_ORACLES];
        const selected = await this.coinPairPrice.isOracleInCurrentRound(newOracleOwner);
        expect(selected).to.be.true;

        const signers = [];
        for (let i = 0; i < MAX_SELECTED_ORACLES / 2; i += 1) {
            const owner = this.owners[i];
            signers.push({ address: this.oracles[owner], owner });
        }
        signers.push({ address: this.oracles[newOracleOwner], owner: newOracleOwner });
        await helpers.publishPrice({
            coinPairPrice: this.coinPairPrice,
            coinPairName: COINPAIR_NAME,
            price: (10 ** 18).toString(),
            oracles: signers,
            publisher: this.oracles[newOracleOwner],
        });

        const { points } = await this.coinPairPrice.getOracleRoundInfo(newOracleOwner);
        expect(points).to.be.bignumber.equal(new BN(1));
    });
});
