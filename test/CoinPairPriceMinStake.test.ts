import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts, OracleDefinition, publishPrice } from './helpers.js';
import {
    assertAddressInList,
    assertAddressNotInList,
    Deployer,
    Viem,
    WalletClients,
} from 'ts-test-helpers';

const coinPairName = 'BTCUSD';
const maxOraclesPerRound = 10n;
const maxSubscribedOraclesPerRound = 20n;
const minSubscriptionStake = 10_000_000_000n;
const initialMintAmount = 800000000000000000000n;

describe('CoinPairPrice Min Stake', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;
    let oracles: OracleDefinition[];

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        oracles = [
            {
                owner: accounts[0],
                address: accounts[1].account!.address,
                signer: accounts[1],
                name: 'oracle1',
            },
            {
                owner: accounts[2],
                address: accounts[3].account!.address,
                signer: accounts[3],
                name: 'oracle2',
            },
            {
                owner: accounts[4],
                address: accounts[5].account!.address,
                signer: accounts[5],
                name: 'oracle3',
            },
        ];
    });

    async function buildFixture() {
        const contracts = await initContracts(deployer, accounts[8], 10n, minSubscriptionStake);
        const coinPairPrice = await initCoinpair(
            deployer,
            coinPairName,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
        );

        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(maxOraclesPerRound);
        expect((await coinPairPrice.read.getRoundInfo())[5].length).to.equal(0);

        return { contracts, coinPairPrice };
    }

    async function mintAndDeposit(
        contracts: Awaited<ReturnType<typeof buildFixture>>['contracts'],
        owner: WalletClients[number],
        stake: bigint,
    ) {
        const initialBalance = await contracts.token.read.balanceOf([owner.account!.address]);
        await contracts.governor.mint(
            contracts.token.address,
            owner.account!.address,
            initialMintAmount,
        );
        await contracts.token.write.approve([contracts.staking.address, stake], {
            account: owner.account!,
        });
        await contracts.staking.write.deposit([stake, owner.account!.address], {
            account: owner.account!,
        });

        const info = await contracts.oracleMgr.read.getOracleRegistrationInfo([
            owner.account!.address,
        ]);
        expect(info[1]).to.equal(stake);
        expect(await contracts.token.read.balanceOf([owner.account!.address])).to.equal(
            initialBalance + initialMintAmount - stake,
        );
    }

    describe('Min subscription stake', function () {
        it('creation', async function () {
            const { contracts } = await buildFixture();
            await contracts.governor.mint(
                contracts.token.address,
                accounts[4].account!.address,
                initialMintAmount,
            );
        });

        it('Should fail to subscribe with less than minSubscriptionStake', async function () {
            const oracleAddr = accounts[3];
            const ownerAccount = accounts[4];

            const { contracts, coinPairPrice } = await buildFixture();
            const stake = minSubscriptionStake - 100000n;

            await contracts.staking.write.registerOracle(
                [oracleAddr.account!.address, 'not enough stake'],
                {
                    account: ownerAccount.account!,
                },
            );
            await mintAndDeposit(contracts, ownerAccount, stake);

            await viem.assertions.revertWith(
                contracts.staking.write.subscribeToCoinPair(
                    [await coinPairPrice.read.getCoinPair()],
                    {
                        account: ownerAccount.account!,
                    },
                ),
                'Not enough stake',
            );
        });
    });

    describe('After subscription if we have less than minSubscriptionStake we are kicked off', function () {
        it('creation', async function () {
            const { contracts } = await buildFixture();
            await contracts.governor.mint(
                contracts.token.address,
                oracles[0].owner.account!.address,
                initialMintAmount,
            );
        });

        it('subscribe other', async function () {
            const { contracts, coinPairPrice } = await buildFixture();
            const coinPair = await coinPairPrice.read.getCoinPair();

            for (let i = 1; i < oracles.length; i += 1) {
                const oracle = oracles[i];
                await contracts.staking.write.registerOracle([oracle.address, 'not enough stake'], {
                    account: oracle.owner.account!,
                });
                await mintAndDeposit(contracts, oracle.owner, minSubscriptionStake);
                await contracts.staking.write.subscribeToCoinPair([coinPair], {
                    account: oracle.owner.account!,
                });

                expect(
                    await contracts.oracleMgr.read.isSubscribed([
                        oracle.owner.account!.address,
                        coinPair,
                    ]),
                ).to.equal(true);
                expect((await coinPairPrice.read.getRoundInfo())[5].length).to.equal(i);
                expect(
                    await contracts.staking.read.getBalance([oracle.owner.account!.address]),
                ).to.equal(minSubscriptionStake);
            }

            const roundInfo = await coinPairPrice.read.getRoundInfo();
            assertAddressInList(roundInfo[5], oracles[1].address);
            assertAddressInList(roundInfo[5], oracles[2].address);
        });

        it('subscribe', async function () {
            const { contracts, coinPairPrice } = await buildFixture();
            const coinPair = await coinPairPrice.read.getCoinPair();
            const oracle = oracles[0];

            await contracts.staking.write.registerOracle([oracle.address, 'not enough stake'], {
                account: oracle.owner.account!,
            });
            await mintAndDeposit(contracts, oracle.owner, minSubscriptionStake);
            await contracts.staking.write.subscribeToCoinPair([coinPair], {
                account: oracle.owner.account!,
            });

            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracle.owner.account!.address,
                    coinPair,
                ]),
            ).to.equal(true);
            assertAddressInList((await coinPairPrice.read.getRoundInfo())[5], oracle.address);
            expect(
                await contracts.staking.read.getBalance([oracle.owner.account!.address]),
            ).to.equal(minSubscriptionStake);
        });

        it('publish', async function () {
            const { contracts, coinPairPrice } = await buildFixture();
            const coinPair = await coinPairPrice.read.getCoinPair();

            for (const oracle of oracles) {
                await contracts.staking.write.registerOracle([oracle.address, 'not enough stake'], {
                    account: oracle.owner.account!,
                });
                await mintAndDeposit(contracts, oracle.owner, minSubscriptionStake);
                await contracts.staking.write.subscribeToCoinPair([coinPair], {
                    account: oracle.owner.account!,
                });
            }

            await publishPrice(coinPairPrice, coinPairName, 300000000000000000n, oracles);

            expect(
                (
                    await coinPairPrice.read.getOracleRoundInfo([oracles[0].owner.account!.address])
                )[0],
            ).to.equal(1n);
        });

        it('withdraw', async function () {
            const { contracts, coinPairPrice } = await buildFixture();
            const coinPair = await coinPairPrice.read.getCoinPair();

            for (const oracle of oracles) {
                await contracts.staking.write.registerOracle([oracle.address, 'not enough stake'], {
                    account: oracle.owner.account!,
                });
                await mintAndDeposit(contracts, oracle.owner, minSubscriptionStake);
                await contracts.staking.write.subscribeToCoinPair([coinPair], {
                    account: oracle.owner.account!,
                });
            }

            await contracts.staking.write.withdraw([1n], { account: oracles[0].owner.account! });
            expect(
                await contracts.staking.read.getBalance([oracles[0].owner.account!.address]),
            ).to.equal(minSubscriptionStake - 1n);
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracles[0].owner.account!.address,
                    coinPair,
                ]),
            ).to.equal(false);
            assertAddressNotInList(
                (await coinPairPrice.read.getRoundInfo())[5],
                oracles[0].address,
            );
            expect(
                (
                    await coinPairPrice.read.getOracleRoundInfo([oracles[0].owner.account!.address])
                )[0],
            ).to.equal(0n);
        });
    });
});
