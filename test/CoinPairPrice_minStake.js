const {BN, expectRevert} = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const {expect} = require('chai');
const ethers = require('ethers');

const COINPAIR = web3.utils.asciiToHex('BTCUSD');
const maxOraclesPerRound = 10;
const maxSubscribedOraclesPerRound = 20;
const minSubscriptionStake = 10000000000;

contract('CoinPairPrice Min Stake', async (accounts) => {
    async function deposit(token, staking, oracleManager, ownerAddr, stake) {
        const initialBalance = await token.balanceOf(ownerAddr);
        await token.approve(staking.address, stake, {from: ownerAddr});
        await staking.deposit(stake, ownerAddr, {from: ownerAddr});
        const info = await oracleManager.getOracleRegistrationInfo(ownerAddr);
        assert.equal(info.stake, stake);
        assert.equal(
            (await token.balanceOf(ownerAddr)).toString(),
            initialBalance.sub(new BN(stake)).toString(),
        );
    }

    async function initContracts(testobj) {
        const contracts = await helpers.initContracts({
            minSubscriptionStake,
            governorOwner: accounts[8],
            period: new BN(10),
        });
        Object.assign(testobj, contracts);
        testobj.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
        });
        assert.equal(
            maxOraclesPerRound,
            (await testobj.coinPairPrice.maxOraclesPerRound()).toNumber(),
        );
        assert.equal((await testobj.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
    }

    describe('Min subscription stake', () => {
        const oracleAddr = accounts[3];
        const ownerAccount = accounts[4];
        it('creation', async () => {
            await initContracts(this);
            // Send funds to new owner account (token and base coin).
            await this.governor.mint(this.token.address, ownerAccount, '8' + '0'.repeat(20));
        });

        it('Should fail to subscribe with less than minSubscriptionStake', async () => {
            const stake = minSubscriptionStake - 1;
            await this.staking.registerOracle(oracleAddr, 'not enough stake', {from: ownerAccount});
            await deposit(this.token, this.staking, this.oracleMgr, ownerAccount, stake);
            await expectRevert(
                this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAccount}),
                'Not enough stake',
            );
        });
    });

    describe('After susbcription if we have less than minSubscriptionStake we are kicked off', async () => {
        const oracleAddr = accounts[3];
        const ownerAccount = accounts[4];
        const otherAddr = accounts[5];
        const otherOwner = accounts[6];
        it('creation', async () => {
            await initContracts(this);
            await this.governor.mint(this.token.address, ownerAccount, '8' + '0'.repeat(20));
        });

        it('subscribe other', async () => {
            await this.governor.mint(this.token.address, otherOwner, '8' + '0'.repeat(20));
            await this.staking.registerOracle(otherAddr, 'not enough stake', {from: otherOwner});
            await deposit(
                this.token,
                this.staking,
                this.oracleMgr,
                otherOwner,
                minSubscriptionStake,
            );
            await this.staking.subscribeToCoinPair(COINPAIR, {from: otherOwner});

            assert.isTrue(await this.oracleMgr.isSubscribed(otherOwner, COINPAIR));
            assert.equal(1, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            assert.equal(otherAddr, (await this.coinPairPrice.getRoundInfo()).selectedOracles[0]);
            expect(await this.staking.getBalance(otherOwner)).to.be.bignumber.equal(
                new BN(minSubscriptionStake),
            );
        });

        it('subscribe', async () => {
            const stake = minSubscriptionStake;
            await this.staking.registerOracle(oracleAddr, 'not enough stake', {from: ownerAccount});
            await deposit(this.token, this.staking, this.oracleMgr, ownerAccount, stake);
            await this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAccount});

            assert.isTrue(await this.oracleMgr.isSubscribed(ownerAccount, COINPAIR));
            expect((await this.coinPairPrice.getRoundInfo()).selectedOracles).to.contain(
                oracleAddr,
            );
            expect(await this.staking.getBalance(ownerAccount)).to.be.bignumber.equal(
                new BN(minSubscriptionStake),
            );
        });

        it('publish', async () => {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleAddr,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleAddr));
            const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, otherAddr));
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleAddr},
            );
            expect(
                (await this.coinPairPrice.getOracleRoundInfo(ownerAccount)).points,
            ).to.be.bignumber.eq(new BN(1));
        });

        it('withdraw', async () => {
            await this.staking.withdraw(1, {from: ownerAccount});
            expect(await this.staking.getBalance(ownerAccount)).to.be.bignumber.equal(
                new BN(minSubscriptionStake - 1),
            );
            assert.isFalse(await this.oracleMgr.isSubscribed(ownerAccount, COINPAIR));
            expect((await this.coinPairPrice.getRoundInfo()).selectedOracles).to.not.contain(
                oracleAddr,
            );
            expect(
                (await this.coinPairPrice.getOracleRoundInfo(ownerAccount)).points,
            ).to.be.bignumber.eq(new BN(0));
        });
    });
});
