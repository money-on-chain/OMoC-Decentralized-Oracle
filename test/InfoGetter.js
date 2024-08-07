const helpers = require('./helpers');
const { expect } = require('chai');
const { toBN, toWei } = require('web3-utils');
const InfoGetter = artifacts.require('InfoGetter');

contract('InfoGetter', async (accounts) => {
    const feesAccount = accounts[1];
    const ORACLE_FEES = toBN(toWei('1', 'ether'));
    const ORACLE_STAKE = toBN(toWei('1', 'ether'));
    const COINPAIR_NAME = 'BTCUSD';

    before(async () => {
        const contracts = await helpers.initContracts({ governorOwner: accounts[8] });
        Object.assign(this, contracts);

        this.infoGetter = await helpers.deployProxySimple(InfoGetter);

        this.coinPairPrice = await helpers.initCoinpair(COINPAIR_NAME, {
            ...contracts,
            whitelist: [accounts[0], this.infoGetter.address],
            minOraclesPerRound: 3,
            maxOraclesPerRound: 3,
            validPricePeriodInBlocks: this.validPricePeriodInBlocks,
        });

        const COINPAIR_ID = await this.coinPairPrice.getCoinPair();

        await this.infoGetter.initialize(this.governor.address);

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

        expect(price).to.not.be.undefined;
    });

    it('getCoinPairUIInfo', async () => {
        const result = await this.infoGetter.getCoinPairUIInfo(this.coinPairPrice.address);
        expect(result).to.not.be.undefined;
        expect(result.round).to.not.be.undefined;
        expect(result.startBlock).to.not.be.undefined;
        expect(result.lockPeriodTimestamp).to.not.be.undefined;
        expect(result.totalPoints).to.not.be.undefined;
        expect(result.info).to.not.be.undefined;
        expect(result.currentBlock).to.not.be.undefined;
        expect(result.lastPubBlock).to.not.be.undefined;
        expect(result.lastPubBlockHash).to.not.be.undefined;
        expect(result.validPricePeriodInBlocks).to.not.be.undefined;
        expect(result.availableRewards).to.not.be.undefined;
    });

    it('getManagerUICoinPairInfo', async () => {
        const result = await this.infoGetter.getManagerUICoinPairInfo(this.oracleMgr.address, 0, 1);
        expect(result).to.not.be.undefined;
        expect(result.length).to.equal(1);
        expect(result[0].addr).to.not.be.undefined;
        expect(result[0].coinPair).to.not.be.undefined;

        // Test offset and limit
        await this.infoGetter.getManagerUICoinPairInfo(this.oracleMgr.address, 1000, 1000);
    });

    it('getManagerUIOracleInfo', async () => {
        const result = await this.infoGetter.getManagerUIOracleInfo(this.oracleMgr.address, 0, 1);
        expect(result).to.not.be.undefined;
        expect(result.info).to.not.be.undefined;
        expect(result.nextEntry).to.not.be.undefined;
        expect(result.info.length).to.equal(1);
        expect(result.info[0].stake).to.not.be.undefined;
        expect(result.info[0].mocsBalance).to.not.be.undefined;
        expect(result.info[0].basecoinBalance).to.not.be.undefined;
        expect(result.info[0].addr).to.not.be.undefined;
        expect(result.info[0].owner).to.not.be.undefined;
        expect(result.info[0].name).to.not.be.undefined;

        // test offset and limit
        await this.infoGetter.getManagerUIOracleInfo(this.oracleMgr.address, 0, 1000);
        await this.infoGetter.getManagerUIOracleInfo(this.oracleMgr.address, 1000, 1000);
    });

    it('getOracleServerInfo', async () => {
        const result = await this.infoGetter.getOracleServerInfo(
            this.oracleMgr.address,
            this.coinPairPrice.address,
        );
        expect(result).to.not.be.undefined;
        expect(result.round).to.not.be.undefined;
        expect(result.startBlock).to.not.be.undefined;
        expect(result.lockPeriodTimestamp).to.not.be.undefined;
        expect(result.totalPoints).to.not.be.undefined;
        expect(result.info).to.not.be.undefined;
        expect(result.price).to.not.be.undefined;
        expect(result.currentBlock).to.not.be.undefined;
        expect(result.lastPubBlock).to.not.be.undefined;
        expect(result.lastPubBlockHash).to.not.be.undefined;
        expect(result.validPricePeriodInBlocks).to.not.be.undefined;
    });
});
