/* global artifacts, beforeEach, contract, it */
const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toWei} = require('web3-utils');
const ethers = require('ethers');

contract('Staking-withdraw', async (accounts) => {
    const feesAccount = accounts[1];
    const TOKEN_FEES = toWei('100', 'ether');
    const governorOwner = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = toWei('1', 'ether');
    const ORACLE_FEES = toWei('1', 'ether');
    const NUM_SELECTED_ORACLES = 10;
    const NUM_ORACLES = 30;
    const MAX_ORACLES = 30;

    const publishPrice = async (price, oracle, signers) => {
        const lastPublicationBlock = await this.coinPairPrice.lastPublicationBlock();

        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            COINPAIR_NAME,
            price,
            oracle,
            lastPublicationBlock.toString(),
        );

        const sortedSigners = signers.slice(0);
        sortedSigners.sort((x, y) => x.localeCompare(y, 'en', {sensitivity: 'base'}));

        const sv = [];
        const sr = [];
        const ss = [];
        for (const signer of sortedSigners) {
            const s = ethers.utils.splitSignature(await web3.eth.sign(encMsg, signer));

            sv.push(s.v);
            sr.push(s.r);
            ss.push(s.s);
        }

        await this.coinPairPrice.publishPrice(
            msg.version,
            web3.utils.asciiToHex(COINPAIR_NAME),
            msg.price,
            msg.votedOracle,
            lastPublicationBlock.toString(),
            sv,
            sr,
            ss,
            {from: oracle},
        );
    };

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake: ORACLE_STAKE,
            maxOraclesPerRound: MAX_ORACLES,
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
            const oracleStake = ORACLE_STAKE + (NUM_ORACLES - i);
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
        const COINPAIR_ID = await this.coinPairPrice.coinPair();
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            const oracleOwner = Object.keys(this.oracles)[i];
            const oracleName = 'oracle-' + i;
            const oracleStake = ORACLE_STAKE + (NUM_ORACLES - i);
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

    it('withdraw and keep in round', async () => {
        const oracleOwner = Object.keys(this.oracles)[NUM_SELECTED_ORACLES - 1];
        let selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
        await this.staking.withdraw(1, {from: oracleOwner});
        selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;
    });

    it('publish price', async () => {
        await this.coinPairPrice.switchRound();

        const oracleOwner = Object.keys(this.oracles)[NUM_SELECTED_ORACLES - 1];
        let selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.true;

        const signers = [];
        for (let i = 0; i < NUM_SELECTED_ORACLES / 2 + 1; i += 1) {
            signers.push(this.oracles[Object.keys(this.oracles)[NUM_SELECTED_ORACLES - 1 - i]]);
        }

        await publishPrice((10 ** 18).toString(), this.oracles[oracleOwner], signers);

        const {points} = await this.coinPairPrice.getOracleRoundInfo(oracleOwner);
        expect(points).to.be.bignumber.equal(new BN(1));
    });

    it('withdraw and dropping from round', async () => {
        const oracleOwner = Object.keys(this.oracles)[NUM_SELECTED_ORACLES - 1];

        await this.staking.withdraw(1, {from: oracleOwner});
        const selected = await this.coinPairPrice.isOracleInCurrentRound(oracleOwner);
        expect(selected).to.be.false;

        const {points} = await this.coinPairPrice.getOracleRoundInfo(oracleOwner);
        expect(points).to.be.bignumber.equal(new BN(0));
    });

    it('new selected oracle can publish', async () => {
        const newOracleOwner = Object.keys(this.oracles)[NUM_SELECTED_ORACLES];
        const selected = await this.coinPairPrice.isOracleInCurrentRound(newOracleOwner);
        expect(selected).to.be.true;

        const signers = [];
        for (let i = 0; i < NUM_SELECTED_ORACLES / 2; i += 1) {
            signers.push(this.oracles[Object.keys(this.oracles)[i]]);
        }
        signers.push(this.oracles[newOracleOwner]);

        await publishPrice((10 ** 18).toString(), this.oracles[newOracleOwner], signers);

        const {points} = await this.coinPairPrice.getOracleRoundInfo(newOracleOwner);
        expect(points).to.be.bignumber.equal(new BN(1));
    });
});
