import { expect } from 'chai';
import { network } from 'hardhat';
import {
    encodeCoinPair,
    initCoinpair,
    initContracts,
    mineUntilNextRound,
    OracleStakeData,
    publishPrice,
    toOracleDefinition,
    type OracleDefinition,
} from './helpers.js';
import { Deployer, type WalletClients } from 'ts-test-helpers';

const COINPAIR_NAME = 'BTCUSD';
const coinPair = encodeCoinPair(COINPAIR_NAME);

describe('Staking-Oracle-States', function () {
    const governorOwnerIndex = 1;
    const maxOraclesPerRound = 3n;
    const maxSubscribedOraclesPerRound = 5n;
    const minSubscriptionStake = 1n * 10n ** 18n;

    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let networkHelpers: any;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairPrice: Awaited<ReturnType<typeof initCoinpair>>;

    let oracleData: OracleStakeData[];
    let minOracle: OracleStakeData;
    let otherOracles: OracleStakeData[];
    let roundOracles: OracleStakeData[];
    let maxOracle: OracleStakeData;
    let roundOracleDefs: OracleDefinition[];

    async function deployContracts() {
        contracts = await initContracts(
            deployer,
            accounts[governorOwnerIndex],
            20n,
            minSubscriptionStake,
        );
        coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
        );
    }

    async function register(data: OracleStakeData) {
        await contracts.governor.mint(
            contracts.token.address,
            data.owner.account!.address,
            data.stake,
        );
        await contracts.token.write.approve([contracts.staking.address, data.stake], {
            account: data.owner.account!,
        });
        await contracts.staking.write.deposit([data.stake, data.owner.account!.address], {
            account: data.owner.account!,
        });
        expect(await contracts.staking.read.getBalance([data.owner.account!.address])).to.equal(
            data.stake,
        );
        await contracts.staking.write.registerOracle([data.account.account!.address, data.name], {
            account: data.owner.account!,
        });
        const info = await contracts.oracleMgr.read.getOracleRegistrationInfo([
            data.owner.account!.address,
        ]);
        expect(info[0]).to.equal(data.name);
        expect(info[1]).to.equal(data.stake);
    }

    async function subscribe(data: OracleStakeData) {
        await contracts.staking.write.subscribeToCoinPair([coinPair], {
            account: data.owner.account!,
        });
    }

    async function unsubscribe(data: OracleStakeData) {
        await contracts.staking.write.unSubscribeFromCoinPair([coinPair], {
            account: data.owner.account!,
        });
    }

    async function checkState(
        data: OracleStakeData,
        state: { registered: boolean; subscribed: boolean; selected: boolean },
    ) {
        expect(
            await contracts.staking.read.isOracleRegistered([data.owner.account!.address]),
        ).to.equal(state.registered);
        expect(
            await contracts.staking.read.isSubscribed([data.owner.account!.address, coinPair]),
        ).to.equal(state.subscribed);
        const oracleRoundInfo = await contracts.oracleMgr.read.getOracleRoundInfo([
            data.owner.account!.address,
            coinPair,
        ]);
        expect(oracleRoundInfo[1]).to.equal(state.selected);
    }

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        const seed = accounts.slice(2, 2 + Number(maxSubscribedOraclesPerRound + 2n));
        oracleData = seed.map((account, idx) => ({
            name: `oracle-a.io-${idx}`,
            stake: minSubscriptionStake + BigInt(idx + 1),
            account,
            owner: accounts[2 * idx],
            address: account.account!.address,
        }));

        const indices = [...Array(oracleData.length).keys()].sort((a, b) =>
            oracleData[a].stake < oracleData[b].stake
                ? -1
                : oracleData[a].stake > oracleData[b].stake
                  ? 1
                  : 0,
        );
        minOracle = oracleData[indices[0]];
        otherOracles = indices.slice(1, indices.length - 1).map((i) => oracleData[i]);
        roundOracles = indices.slice(1, Number(maxOraclesPerRound) + 1).map((i) => oracleData[i]);
        maxOracle = oracleData[indices[indices.length - 1]];
        roundOracleDefs = roundOracles.map(toOracleDefinition);
    });

    describe('Registered Oracles', function () {
        describe('Can unregister', function () {
            it('if they are not subscribed nor selected', async function () {
                await deployContracts();
                const oracle = otherOracles[0];
                await register(oracle);

                await checkState(oracle, {
                    registered: true,
                    subscribed: false,
                    selected: false,
                });

                expect(
                    await contracts.staking.read.canRemoveOracle([oracle.owner.account!.address]),
                ).to.be.true;
                await contracts.staking.write.removeOracle({ account: oracle.owner.account! });

                await checkState(oracle, {
                    registered: false,
                    subscribed: false,
                    selected: false,
                });
            });
        });

        describe('Can NOT unregister', function () {
            it('if subscribed', async function () {
                await deployContracts();
                for (const data of otherOracles) {
                    await register(data);
                    await subscribe(data);
                }
                await register(maxOracle);
                await subscribe(maxOracle);

                await checkState(maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                expect(
                    await contracts.staking.read.canRemoveOracle([
                        maxOracle.owner.account!.address,
                    ]),
                ).to.be.true;
                await contracts.staking.write.removeOracle({ account: maxOracle.owner.account! });
                await checkState(maxOracle, {
                    registered: false,
                    subscribed: false,
                    selected: false,
                });
            });

            it('if subscribed and selected', async function () {
                await deployContracts();
                const oracle = otherOracles[0];
                await register(oracle);
                await subscribe(oracle);

                await checkState(oracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
                expect(
                    await contracts.staking.read.canRemoveOracle([
                        maxOracle.owner.account!.address,
                    ]),
                ).to.be.false;

                await viem.assertions.revertWith(
                    contracts.staking.write.removeOracle({ account: oracle.owner.account! }),
                    'Not ready to remove',
                );
            });

            it('if selected', async function () {
                await deployContracts();
                const oracle = otherOracles[0];
                await register(oracle);
                await subscribe(oracle);
                await unsubscribe(oracle);

                await checkState(oracle, {
                    registered: true,
                    subscribed: false,
                    selected: true,
                });

                expect(
                    await contracts.staking.read.canRemoveOracle([
                        maxOracle.owner.account!.address,
                    ]),
                ).to.be.false;
                await viem.assertions.revertWith(
                    contracts.staking.write.removeOracle({ account: oracle.owner.account! }),
                    'Not ready to remove',
                );
            });
        });

        describe('Can subscribe', function () {
            it('and got selected automatically because the selected list is empty', async function () {
                await deployContracts();
                const oracle = otherOracles[0];
                await register(oracle);
                await subscribe(oracle);
                await checkState(oracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });

            it("but won't get selected until next round because the selected list is full", async function () {
                await deployContracts();
                for (const data of roundOracles) {
                    await register(data);
                    await subscribe(data);
                }
                await register(maxOracle);
                await subscribe(maxOracle);

                await checkState(maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
                await coinPairPrice.write.switchRound();

                await checkState(maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });

            it('with the subscribed list full but enough stake, if the selected list they get selected in next round', async function () {
                await deployContracts();
                for (const data of otherOracles) {
                    await register(data);
                    await subscribe(data);
                }
                await register(maxOracle);
                await subscribe(maxOracle);

                await checkState(maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: false,
                });

                await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
                await coinPairPrice.write.switchRound();

                await checkState(maxOracle, {
                    registered: true,
                    subscribed: true,
                    selected: true,
                });
            });
        });

        it("Can not subscribe to a coin pair if the subscription list is full and they don't have enough stake", async function () {
            await deployContracts();
            for (const data of otherOracles) {
                await register(data);
                await subscribe(data);
            }
            await register(minOracle);

            await checkState(minOracle, {
                registered: true,
                subscribed: false,
                selected: false,
            });

            await viem.assertions.revertWith(
                contracts.staking.write.subscribeToCoinPair([coinPair], {
                    account: minOracle.owner.account!,
                }),
                'Not enough stake to add',
            );
        });
    });

    describe('Selected Oracles', function () {
        const rewards = 123n * 10n ** 18n;

        it('Are rewarded at the end of the round when they publish', async function () {
            await deployContracts();
            for (const data of roundOracles) {
                await register(data);
                await subscribe(data);
            }

            const oracle = roundOracles[0];
            await checkState(oracle, { registered: true, subscribed: true, selected: true });

            await publishPrice(coinPairPrice, COINPAIR_NAME, 123412389123n, roundOracleDefs);
            await contracts.governor.mint(contracts.token.address, coinPairPrice.address, rewards);
            await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
            await coinPairPrice.write.switchRound();
            expect(await contracts.token.read.balanceOf([oracle.owner.account!.address])).to.equal(
                rewards,
            );
        });

        it('Are punished when they withdraw the stake in the middle of the round', async function () {
            await deployContracts();
            for (const data of roundOracles) {
                await register(data);
                await subscribe(data);
            }

            const oracle = roundOracles[0];
            await checkState(oracle, { registered: true, subscribed: true, selected: true });

            await publishPrice(coinPairPrice, COINPAIR_NAME, 123412389123n, roundOracleDefs);
            await contracts.governor.mint(contracts.token.address, coinPairPrice.address, rewards);
            await mineUntilNextRound(networkHelpers, viem, coinPairPrice);

            const oracleRoundInfoPre = await contracts.oracleMgr.read.getOracleRoundInfo([
                oracle.owner.account!.address,
                coinPair,
            ]);
            expect(oracleRoundInfoPre[0]).to.equal(1n);
            await contracts.staking.write.withdraw([oracle.stake], {
                account: oracle.owner.account!,
            });
            const oracleRoundInfoPos = await contracts.oracleMgr.read.getOracleRoundInfo([
                oracle.owner.account!.address,
                coinPair,
            ]);
            expect(oracleRoundInfoPos[0]).to.equal(0n);

            await checkState(oracle, { registered: true, subscribed: false, selected: false });
            await coinPairPrice.write.switchRound();
            expect(await contracts.token.read.balanceOf([oracle.owner.account!.address])).to.equal(
                0n,
            );
        });

        it('Are punished when they unsubscribe and withdraw the stake in the middle of the round', async function () {
            await deployContracts();
            for (const data of roundOracles) {
                await register(data);
                await subscribe(data);
            }

            const oracle = roundOracles[0];
            await checkState(oracle, { registered: true, subscribed: true, selected: true });
            await unsubscribe(oracle);
            await checkState(oracle, { registered: true, subscribed: false, selected: true });

            await publishPrice(coinPairPrice, COINPAIR_NAME, 123412389123n, roundOracleDefs);
            await contracts.governor.mint(contracts.token.address, coinPairPrice.address, rewards);
            await mineUntilNextRound(networkHelpers, viem, coinPairPrice);

            const oracleRoundInfoPre = await contracts.oracleMgr.read.getOracleRoundInfo([
                oracle.owner.account!.address,
                coinPair,
            ]);
            expect(oracleRoundInfoPre[0]).to.equal(1n);
            await contracts.staking.write.withdraw([oracle.stake], {
                account: oracle.owner.account!,
            });
            const oracleRoundInfoPos = await contracts.oracleMgr.read.getOracleRoundInfo([
                oracle.owner.account!.address,
                coinPair,
            ]);
            expect(oracleRoundInfoPos[0]).to.equal(0n);

            await checkState(oracle, { registered: true, subscribed: false, selected: false });
            await coinPairPrice.write.switchRound();
            expect(await contracts.token.read.balanceOf([oracle.owner.account!.address])).to.equal(
                0n,
            );
        });

        it('Can unsubscribe, wait for the round end and withdraw their stake without punishment', async function () {
            await deployContracts();
            for (const data of roundOracles) {
                await register(data);
                await subscribe(data);
            }

            const oracle = roundOracles[0];
            await checkState(oracle, { registered: true, subscribed: true, selected: true });
            await unsubscribe(oracle);
            await checkState(oracle, { registered: true, subscribed: false, selected: true });

            await publishPrice(coinPairPrice, COINPAIR_NAME, 123412389123n, roundOracleDefs);
            await contracts.governor.mint(contracts.token.address, coinPairPrice.address, rewards);
            await mineUntilNextRound(networkHelpers, viem, coinPairPrice);

            await coinPairPrice.write.switchRound();
            expect(await contracts.token.read.balanceOf([oracle.owner.account!.address])).to.equal(
                rewards,
            );

            await checkState(oracle, { registered: true, subscribed: false, selected: false });
        });
    });
});
