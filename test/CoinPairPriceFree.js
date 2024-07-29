const helpers = require('./helpers');
const { expectRevert, BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { toBN, toWei } = require('web3-utils');
const CoinPairPriceFree = artifacts.require('CoinPairPriceFree');

contract('CoinPairPriceFree', async (accounts) => {
    const feesAccount = accounts[1];
    const ORACLE_FEES = toBN(toWei('1', 'ether'));
    const ORACLE_STAKE = toBN(toWei('1', 'ether'));
    const COINPAIR_NAME = 'BTCUSD';

    it('CoinPairPriceFree', async () => {
        const contracts = await helpers.initContracts({ governorOwner: accounts[8] });
        Object.assign(this, contracts);

        this.coinPairPriceFree = await helpers.deployProxySimple(CoinPairPriceFree);

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            whitelist: [accounts[0], this.coinPairPriceFree.address],
            minOraclesPerRound: 3,
            maxOraclesPerRound: 3,
            validPricePeriodInBlocks: this.validPricePeriodInBlocks,
        });

        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();

        await this.coinPairPriceFree.initialize(this.coinPairPrice.address);

        const oracles = [
            {
                owner: accounts[2],
                address: accounts[3],
                name: 'oracle1',
            },
            {
                owner: accounts[4],
                address: accounts[5],
                name: 'oracle2',
            },
            {
                owner: accounts[6],
                address: accounts[7],
                name: 'oracle3',
            },
        ];

        for (let i = 0; i < oracles.length; i++) {
            await this.governor.mint(this.token.address, oracles[i].owner, ORACLE_STAKE);
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracles[i].owner,
                value: ORACLE_FEES,
            });
            await web3.eth.sendTransaction({
                from: feesAccount,
                to: oracles[i].address,
                value: ORACLE_FEES,
            });
            await this.token.approve(this.staking.address, ORACLE_STAKE, {
                from: oracles[i].owner,
            });
            await this.staking.registerOracle(oracles[i].address, oracles[i].name, {
                from: oracles[i].owner,
            });
            await this.staking.deposit(ORACLE_STAKE, oracles[i].owner, { from: oracles[i].owner });
            await this.staking.subscribeToCoinPair(COINPAIR_ID, { from: oracles[i].owner });
        }

        await this.coinPairPrice.switchRound();

        const price = (10 ** 18).toString();

        await helpers.publishPrice({
            coinPairPrice: this.coinPairPrice,
            coinPairName: COINPAIR_NAME,
            price,
            oracles,
        });

        await expectRevert(
            this.coinPairPrice.peek({ from: accounts[9] }),
            'Address is not whitelisted',
        );

        const { 0: publishedPrice, 1: valid } = await this.coinPairPriceFree.peek({
            from: accounts[9],
        });
        expect(valid).to.be.true;
        expect(toBN(publishedPrice)).to.be.bignumber.equal(toBN(price));

        const res1 = await this.coinPairPriceFree.getPrice({
            from: accounts[9],
        });
        expect(res1).to.be.bignumber.equal(toBN(price));

        const res2 = await this.coinPairPriceFree.getIsValid({
            from: accounts[9],
        });
        expect(res2).to.be.true;

        const lastPublicationBlock = await this.coinPairPrice.getLastPublicationBlock();
        const res3 = await this.coinPairPriceFree.getLastPublicationBlock({
            from: accounts[9],
        });
        expect(res3).to.be.bignumber.equal(lastPublicationBlock);

        const res4 = await this.coinPairPriceFree.getPriceInfo({
            from: accounts[9],
        });

        expect(toBN(res4[0])).to.be.bignumber.equal(toBN(price));
        expect(res4[1]).to.be.true;
        expect(res4[2]).to.be.bignumber.equal(lastPublicationBlock);
    });
});
