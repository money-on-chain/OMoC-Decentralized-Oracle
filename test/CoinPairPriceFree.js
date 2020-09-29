const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toBN, toWei} = require('web3-utils');
const CoinPairPriceFree = artifacts.require('CoinPairPriceFree');

contract('CoinPairPriceFree', async (accounts) => {
    const feesAccount = accounts[1];
    const ORACLE_FEES = toBN(toWei('1', 'ether'));
    const ORACLE_STAKE = toBN(toWei('1', 'ether'));
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_NAME = 'ORACLE-A';

    it('CoinPairPriceFree', async () => {
        const contracts = await helpers.initContracts({governorOwner: accounts[8]});
        Object.assign(this, contracts);

        this.coinPairPriceFree = await CoinPairPriceFree.new();

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            whitelist: [accounts[0], this.coinPairPriceFree.address],
            maxOraclesPerRound: 3,
            validPricePeriodInBlocks: this.validPricePeriodInBlocks,
        });

        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();

        await this.coinPairPriceFree.initialize(this.coinPairPrice.address);

        const oracleOwner = await helpers.newUnlockedAccount();
        const oracle = await helpers.newUnlockedAccount();

        await this.governor.mint(this.token.address, oracleOwner, ORACLE_STAKE);
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

        await this.token.approve(this.staking.address, ORACLE_STAKE, {from: oracleOwner});
        await this.staking.registerOracle(oracle, ORACLE_NAME, {
            from: oracleOwner,
        });
        await this.staking.deposit(ORACLE_STAKE, oracleOwner, {from: oracleOwner});
        await this.staking.subscribeToCoinPair(COINPAIR_ID, {from: oracleOwner});

        await this.coinPairPrice.switchRound();

        const price = (10 ** 18).toString();

        await helpers.publishPrice({
            coinPairPrice: this.coinPairPrice,
            coinPairName: COINPAIR_NAME,
            price,
            oracle,
            signers: [oracle],
        });

        await expectRevert(
            this.coinPairPrice.peek({from: accounts[9]}),
            'Address is not whitelisted',
        );

        const {0: publishedPrice, 1: valid} = await this.coinPairPriceFree.peek({
            from: accounts[9],
        });
        expect(valid).to.be.true;
        expect(toBN(publishedPrice)).to.be.bignumber.equal(toBN(price));
    });
});
