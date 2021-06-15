/* global it, describe, contract, beforeEach */
/* eslint-disable no-unused-expressions */
const helpers = require('./helpers');
const chai = require('chai');
const { expect } = chai;
const { expectRevert } = require('@openzeppelin/test-helpers');
const { toWei, toBN } = require('web3-utils');
/*
    See: https://hackmd.io/3luAkkSFSIa8gYknMz81hA
 */
contract('Staking-Oracle-States', async (accounts) => {
    const COINPAIR = 'BTCUSD';
    const coinPair = web3.utils.asciiToHex(COINPAIR);
    const governorOwner = accounts[1];
    const maxOraclesPerRound = 3;
    const maxSubscribedOraclesPerRound = 5;
    const minSubscriptionStake = toBN(toWei('1', 'ether'));
    // We start in index 2, add maxSubscribedOraclesPerRound and two more for minOracle and maxOracle
    const oracleData = accounts.slice(2, 2 + maxSubscribedOraclesPerRound + 2).map((x, idx) => ({
        name: 'oracle-a.io-' + idx,
        stake: minSubscriptionStake.add(toBN(Math.floor(1 + Math.random() * 10 ** 18))),
        oracle: accounts[idx],
        owner: accounts[2 * idx],
    }));
    const indices = [...Array(oracleData.length).keys()].sort((a, b) =>
        oracleData[a].stake.cmp(oracleData[b].stake),
    );
    const minOracle = oracleData[indices[0]];
    const otherOracles = indices.slice(1, indices.length - 1).map((i) => oracleData[i]);
    const roundOracles = indices.slice(1, maxOraclesPerRound + 1).map((i) => oracleData[i]);
    const maxOracle = oracleData[indices[indices.length - 1]];

    const deployContracts = async (tests) => {
        const contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake,
        });
        Object.assign(tests, contracts);
        tests.coinPairPrice = await helpers.initCoinpair(COINPAIR, {
            ...contracts,
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            whitelist: [accounts[0]],
        });
    };

    const register = async (tests, data) => {
        await tests.governor.mint(tests.token.address, data.owner, data.stake);
        await tests.token.approve(tests.staking.address, data.stake, { from: data.owner });
        await tests.staking.deposit(data.stake, data.owner, { from: data.owner });
        expect(await tests.staking.getBalance(data.owner)).to.be.bignumber.equal(data.stake);
        await tests.staking.registerOracle(data.oracle, data.name, { from: data.owner });
        const info = await tests.oracleMgr.getOracleRegistrationInfo(data.owner);
        expect(info.internetName).to.be.equal(data.name);
        expect(info.stake).to.be.bignumber.equal(data.stake);
    };

    const subscribe = async (tests, data) => {
        await tests.staking.subscribeToCoinPair(coinPair, { from: data.owner });
    };

    const unsubscribe = async (tests, data) => {
        await tests.staking.unSubscribeFromCoinPair(coinPair, { from: data.owner });
    };

    const checkState = async (tests, data, state) => {
        expect(await tests.staking.isOracleRegistered(data.owner)).to.be.equal(
            !!state.registered,
            'registered',
        );
        expect(await tests.staking.isSubscribed(data.owner, coinPair)).to.be.equal(
            !!state.subscribed,
            'subscribed',
        );
        const oracleRoundInfo = await tests.oracleMgr.getOracleRoundInfo(data.owner, coinPair);
        expect(oracleRoundInfo.selectedInCurrentRound).to.be.equal(!!state.selected, 'selected');
    };

    describe('Registered Oracles', () => {
        describe('Can unregister', () => {
            it('if they are not subscribed nor selected', async () => {
                await deployContracts(this);
                const oracle = otherOracles[0];
                await register(this, oracle);

                await checkState(this, oracle, {
                    registered: true,
                    subscribed: false,
                    selected: false,
                });

                expect(await this.staking.canRemoveOracle(oracle.owner)).to.be.true;
                await this.staking.removeOracle({ from: oracle.owner });

                await checkState(this, oracle, {
                    registered: false,
                    subscribed: false,
                    selected: false,
                });
            });
        });

        describe('Can NOT unregister', () => {
            it('if subscribed', async () => {
                await deployContracts(this);
                for (const data of otherOracles) {
                    await register(this, data);
                    await subscribe(this, data);
                }
                await register(this, maxOracle);
                await subscribe(this, maxOracle);

                await checkState(this, maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                expect(await this.staking.canRemoveOracle(maxOracle.owner)).to.be.true;
                await this.staking.removeOracle({ from: maxOracle.owner });
                await checkState(this, maxOracle, {
                    registered: false,
                    subscribed: false,
                    selected: false,
                });
            });

            it('if subscribed and selected', async () => {
                await deployContracts(this);
                const oracle = otherOracles[0];
                await register(this, oracle);
                await subscribe(this, oracle);

                await checkState(this, oracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
                expect(await this.staking.canRemoveOracle(maxOracle.owner)).to.be.false;
                await expectRevert(
                    this.staking.removeOracle({ from: oracle.owner }),
                    'Not ready to remove',
                );
            });

            it('if selected', async () => {
                await deployContracts(this);
                const oracle = otherOracles[0];
                await register(this, oracle);
                await subscribe(this, oracle);
                await unsubscribe(this, oracle);

                // Only selected
                await checkState(this, oracle, {
                    registered: true,
                    subscribed: false,
                    selected: true,
                });

                expect(await this.staking.canRemoveOracle(maxOracle.owner)).to.be.false;
                await expectRevert(
                    this.staking.removeOracle({ from: oracle.owner }),
                    'Not ready to remove',
                );
            });
        });

        describe('Can subscribe', () => {
            it('and got selected automatically because the selected list is empty', async () => {
                await deployContracts(this);
                const oracle = otherOracles[0];
                await register(this, oracle);
                await subscribe(this, oracle);
                await checkState(this, oracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });

            it("but won't get selected until next round because the selected list is full", async () => {
                await deployContracts(this);
                for (const data of roundOracles) {
                    await register(this, data);
                    await subscribe(this, data);
                }
                await register(this, maxOracle);
                await subscribe(this, maxOracle);

                await checkState(this, maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                await helpers.mineUntilNextRound(this.coinPairPrice);
                await this.coinPairPrice.switchRound();

                await checkState(this, maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });

            it('with the subscribed list full but enough stake, if the selected list they get selected in next round', async () => {
                await deployContracts(this);
                for (const data of otherOracles) {
                    await register(this, data);
                    await subscribe(this, data);
                }
                await register(this, maxOracle);
                await subscribe(this, maxOracle);

                await checkState(this, maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                await helpers.mineUntilNextRound(this.coinPairPrice);
                await this.coinPairPrice.switchRound();

                await checkState(this, maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });
        });

        it("Can not subscribe to a coin pair if the subscription list is full and they don't have enough stake", async () => {
            await deployContracts(this);
            for (const data of otherOracles) {
                await register(this, data);
                await subscribe(this, data);
            }
            await register(this, minOracle);

            await checkState(this, minOracle, {
                registered: true,
                subscribed: false,
                selected: false,
            });

            await expectRevert(
                this.staking.subscribeToCoinPair(coinPair, { from: minOracle.owner }),
                'Not enough stake to add',
            );
        });
    });

    describe('Selected Oracles', () => {
        const rewards = toBN(toWei('123', 'ether'));
        it('Are rewarded at the end of the round when they publish', async () => {
            await deployContracts(this);
            for (const data of roundOracles) {
                await register(this, data);
                await subscribe(this, data);
            }

            const oracle = roundOracles[0];
            await checkState(this, oracle, { registered: true, subscribed: true, selected: true });

            await helpers.publishPrice({
                coinPairPrice: this.coinPairPrice,
                coinPairName: COINPAIR,
                price: '123412389123',
                oracles: roundOracles.map((x) => ({ ...x, address: x.oracle })),
            });
            await this.governor.mint(this.token.address, this.coinPairPrice.address, rewards);
            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
            expect(await this.token.balanceOf(oracle.owner)).to.be.bignumber.equal(rewards);
        });

        it('Are punished when they withdraw the stake in the middle of the round', async () => {
            await deployContracts(this);
            for (const data of roundOracles) {
                await register(this, data);
                await subscribe(this, data);
            }

            const oracle = roundOracles[0];
            await checkState(this, oracle, { registered: true, subscribed: true, selected: true });

            await helpers.publishPrice({
                coinPairPrice: this.coinPairPrice,
                coinPairName: COINPAIR,
                price: '123412389123',
                oracles: roundOracles.map((x) => ({ ...x, address: x.oracle })),
            });
            await this.governor.mint(this.token.address, this.coinPairPrice.address, rewards);
            await helpers.mineUntilNextRound(this.coinPairPrice);

            const oracleRoundInfoPre = await this.oracleMgr.getOracleRoundInfo(
                oracle.owner,
                coinPair,
            );
            expect(oracleRoundInfoPre.points).to.be.bignumber.equal(toBN('1'));
            await this.staking.withdraw(oracle.stake, { from: oracle.owner });
            // Punished, have 0 point now.
            const oracleRoundInfoPos = await this.oracleMgr.getOracleRoundInfo(
                oracle.owner,
                coinPair,
            );
            expect(oracleRoundInfoPos.points).to.be.bignumber.equal(toBN('0'));

            await checkState(this, oracle, {
                registered: true,
                subscribed: false,
                selected: false,
            });

            await this.coinPairPrice.switchRound();
            expect(await this.token.balanceOf(oracle.owner)).to.be.bignumber.equal(toBN(0));
        });

        it('Are punished when they unsubscribe and withdraw the stake in the middle of the round', async () => {
            await deployContracts(this);
            for (const data of roundOracles) {
                await register(this, data);
                await subscribe(this, data);
            }

            const oracle = roundOracles[0];
            await checkState(this, oracle, { registered: true, subscribed: true, selected: true });
            await unsubscribe(this, oracle);
            await checkState(this, oracle, { registered: true, subscribed: false, selected: true });

            await helpers.publishPrice({
                coinPairPrice: this.coinPairPrice,
                coinPairName: COINPAIR,
                price: '123412389123',
                oracles: roundOracles.map((x) => ({ ...x, address: x.oracle })),
            });
            await this.governor.mint(this.token.address, this.coinPairPrice.address, rewards);
            await helpers.mineUntilNextRound(this.coinPairPrice);

            const oracleRoundInfoPre = await this.oracleMgr.getOracleRoundInfo(
                oracle.owner,
                coinPair,
            );
            expect(oracleRoundInfoPre.points).to.be.bignumber.equal(toBN('1'));
            await this.staking.withdraw(oracle.stake, { from: oracle.owner });
            // Punished, have 0 point now.
            const oracleRoundInfoPos = await this.oracleMgr.getOracleRoundInfo(
                oracle.owner,
                coinPair,
            );
            expect(oracleRoundInfoPos.points).to.be.bignumber.equal(toBN('0'));

            await checkState(this, oracle, {
                registered: true,
                subscribed: false,
                selected: false,
            });

            await this.coinPairPrice.switchRound();
            expect(await this.token.balanceOf(oracle.owner)).to.be.bignumber.equal(toBN(0));
        });

        it('Can unsubscribe, wait for the round end and withdraw their stake without punishment', async () => {
            await deployContracts(this);
            for (const data of roundOracles) {
                await register(this, data);
                await subscribe(this, data);
            }

            const oracle = roundOracles[0];
            await checkState(this, oracle, { registered: true, subscribed: true, selected: true });
            await unsubscribe(this, oracle);
            await checkState(this, oracle, { registered: true, subscribed: false, selected: true });

            await helpers.publishPrice({
                coinPairPrice: this.coinPairPrice,
                coinPairName: COINPAIR,
                price: '123412389123',
                oracles: roundOracles.map((x) => ({ ...x, address: x.oracle })),
            });
            await this.governor.mint(this.token.address, this.coinPairPrice.address, rewards);
            await helpers.mineUntilNextRound(this.coinPairPrice);

            await this.coinPairPrice.switchRound();
            expect(await this.token.balanceOf(oracle.owner)).to.be.bignumber.equal(rewards);

            await checkState(this, oracle, {
                registered: true,
                subscribed: false,
                selected: false,
            });
        });
    });
});
