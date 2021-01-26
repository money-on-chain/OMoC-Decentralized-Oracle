const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const { expect } = require('chai');
const ethers = require('ethers');

const COINPAIR = web3.utils.asciiToHex('BTCUSD');
const minOraclesPerRound = 3;
const maxOraclesPerRound = 10;
const maxSubscribedOraclesPerRound = 20;
const minSubscriptionStake = 10000000000;

contract('CoinPairPrice Min Stake', async (accounts) => {
    async function deposit(token, staking, oracleManager, ownerAddr, stake) {
        const initialBalance = await token.balanceOf(ownerAddr);
        await token.approve(staking.address, stake, { from: ownerAddr });
        await staking.deposit(stake, ownerAddr, { from: ownerAddr });
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
            minOraclesPerRound,
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
            const stake = minSubscriptionStake - 100000;
            await this.staking.registerOracle(oracleAddr, 'not enough stake', {
                from: ownerAccount,
            });
            await deposit(this.token, this.staking, this.oracleMgr, ownerAccount, stake);
            await expectRevert(
                this.staking.subscribeToCoinPair(COINPAIR, { from: ownerAccount }),
                'Not enough stake',
            );
        });
    });

    describe('After subscription if we have less than minSubscriptionStake we are kicked off', async () => {
        const oracles = [
            {
                owner: accounts[0],
                address: accounts[1],
                name: 'oracle1',
            },
            {
                owner: accounts[2],
                address: accounts[3],
                name: 'oracle2',
            },
            {
                owner: accounts[4],
                address: accounts[5],
                name: 'oracle3',
            },
        ];
        it('creation', async () => {
            await initContracts(this);
            await this.governor.mint(this.token.address, oracles[0].owner, '8' + '0'.repeat(20));
        });

        it('subscribe other', async () => {
            for (let i = 1; i < oracles.length; i++) {
                await this.governor.mint(
                    this.token.address,
                    oracles[i].owner,
                    '8' + '0'.repeat(20),
                );
                await this.staking.registerOracle(oracles[i].address, 'not enough stake', {
                    from: oracles[i].owner,
                });
                await deposit(
                    this.token,
                    this.staking,
                    this.oracleMgr,
                    oracles[i].owner,
                    minSubscriptionStake,
                );
                await this.staking.subscribeToCoinPair(COINPAIR, { from: oracles[i].owner });
                assert.isTrue(await this.oracleMgr.isSubscribed(oracles[i].owner, COINPAIR));
                assert.equal(i, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
                expect(await this.staking.getBalance(oracles[i].owner)).to.be.bignumber.equal(
                    new BN(minSubscriptionStake),
                );
            }

            assert.equal(
                oracles[1].address,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles[0],
            );
            assert.equal(
                oracles[2].address,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles[1],
            );
        });

        it('subscribe', async () => {
            const stake = minSubscriptionStake;
            await this.staking.registerOracle(oracles[0].address, 'not enough stake', {
                from: oracles[0].owner,
            });
            await deposit(this.token, this.staking, this.oracleMgr, oracles[0].owner, stake);
            await this.staking.subscribeToCoinPair(COINPAIR, { from: oracles[0].owner });

            assert.isTrue(await this.oracleMgr.isSubscribed(oracles[0].owner, COINPAIR));
            expect((await this.coinPairPrice.getRoundInfo()).selectedOracles).to.contain(
                oracles[0].address,
            );
            expect(await this.staking.getBalance(oracles[0].owner)).to.be.bignumber.equal(
                new BN(minSubscriptionStake),
            );
        });

        it('publish', async () => {
            const { msg, encMsg } = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracles[0].address,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[0].address));
            const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[1].address));
            const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[2].address));

            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                { from: oracles[0].address },
            );
            expect(
                (await this.coinPairPrice.getOracleRoundInfo(oracles[0].owner)).points,
            ).to.be.bignumber.eq(new BN(1));
        });

        it('withdraw', async () => {
            await this.staking.withdraw(1, { from: oracles[0].owner });
            expect(await this.staking.getBalance(oracles[0].owner)).to.be.bignumber.equal(
                new BN(minSubscriptionStake - 1),
            );
            assert.isFalse(await this.oracleMgr.isSubscribed(oracles[0].owner, COINPAIR));
            expect((await this.coinPairPrice.getRoundInfo()).selectedOracles).to.not.contain(
                oracles[0].address,
            );
            expect(
                (await this.coinPairPrice.getOracleRoundInfo(oracles[0].owner)).points,
            ).to.be.bignumber.eq(new BN(0));
        });
    });
});
