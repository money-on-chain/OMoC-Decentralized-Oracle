import { expect } from 'chai';
import { network } from 'hardhat';
import { parseSignature } from 'viem';
import {
    getDefaultEncodedMessage,
    initCoinpair,
    initContracts,
    mineUntilNextRound,
    OracleStakeData,
} from './helpers.js';
import {
    assertAddressInList,
    Deployer,
    type ContractOf,
    type Viem,
    type WalletClients,
} from 'ts-test-helpers';

const coinPairName = 'BTCUSD';
const feeSourceAccount = 0;
const feeAmount = 330000000000000000n;
const price = 300000000000000000n;
const initialBalance = 800000000000000000000n;

type Fixture = {
    viem: Viem;
    networkHelpers: any;
    deployer: Deployer;
    accounts: WalletClients;
    contracts: Awaited<ReturnType<typeof initContracts>>;
    coinPairPrice: ContractOf<'CoinPairPrice'>;
    oracleData: OracleStakeData[];
};

describe('CoinPairPrice distribution', function () {
    async function buildFixture(maxOraclesPerRound = 4n): Promise<Fixture> {
        const { viem, networkHelpers } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContracts(deployer, accounts[8]);
        const coinPairPrice = await initCoinpair(
            deployer,
            coinPairName,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            maxOraclesPerRound,
            30n,
            60n,
            0n,
            3n,
        );

        const oracleData: OracleStakeData[] = [
            {
                name: 'oracle-a.io',
                stake: 4n * 10n ** 18n,
                account: accounts[1],
                owner: accounts[2],
                address: accounts[1].account!.address,
            },
            {
                name: 'oracle-b.io',
                stake: 8n * 10n ** 18n,
                account: accounts[3],
                owner: accounts[4],
                address: accounts[3].account!.address,
            },
            {
                name: 'oracle-c.io',
                stake: 3n * 10n ** 18n,
                account: accounts[5],
                owner: accounts[6],
                address: accounts[5].account!.address,
            },
            {
                name: 'oracle-d.io',
                stake: 1n * 10n ** 18n,
                account: accounts[7],
                owner: accounts[8],
                address: accounts[7].account!.address,
            },
        ];

        for (const index of [0, 2, 4, 6, 8]) {
            await contracts.governor.mint(
                contracts.token.address,
                accounts[index].account!.address,
                initialBalance,
            );
        }

        expect(Number(await coinPairPrice.read.getPriceProviderType())).to.equal(1);
        expect(Number(await coinPairPrice.read.roundLockPeriodSecs())).to.equal(60);

        return { viem, networkHelpers, deployer, accounts, contracts, coinPairPrice, oracleData };
    }

    async function registerAndSubscribe(fixture: Fixture, count: number) {
        const coinPair = await fixture.coinPairPrice.read.getCoinPair();

        for (const oracle of fixture.oracleData.slice(0, count)) {
            await fixture.contracts.token.write.approve(
                [fixture.contracts.staking.address, oracle.stake],
                { account: oracle.owner.account! },
            );
            await fixture.contracts.staking.write.registerOracle([oracle.address, oracle.name], {
                account: oracle.owner.account!,
            });
            await fixture.contracts.staking.write.deposit(
                [oracle.stake, oracle.owner.account!.address],
                { account: oracle.owner.account! },
            );
            await fixture.contracts.staking.write.subscribeToCoinPair([coinPair], {
                account: oracle.owner.account!,
            });
        }
    }

    async function addFees(fixture: Fixture) {
        const oldFees = await fixture.coinPairPrice.read.getAvailableRewardFees();
        await fixture.contracts.token.write.transfer([fixture.coinPairPrice.address, feeAmount], {
            account: fixture.accounts[feeSourceAccount].account!,
        });
        expect(await fixture.coinPairPrice.read.getAvailableRewardFees()).to.equal(
            oldFees + feeAmount,
        );
    }

    async function publishOnce(fixture: Fixture, publisherIndex: number, signerCount: number) {
        const publisher = fixture.oracleData[publisherIndex];
        const coinPair = await fixture.coinPairPrice.read.getCoinPair();
        const lastPublicationBlock = await fixture.coinPairPrice.read.getLastPublicationBlock();
        const { msg, encMsg } = await getDefaultEncodedMessage(
            3,
            coinPairName,
            price,
            publisher.address,
            lastPublicationBlock,
        );
        const signers = fixture.oracleData
            .slice(0, signerCount)
            .slice()
            .sort((left, right) => {
                if (left.address < right.address) {
                    return -1;
                }
                if (left.address > right.address) {
                    return 1;
                }
                return 0;
            });
        const signatures = await Promise.all(
            signers.map(async (oracle) =>
                parseSignature(
                    await oracle.account.signMessage({
                        account: oracle.account.account!,
                        message: { raw: encMsg },
                    }),
                ),
            ),
        );

        for (const signature of signatures) {
            if (signature.v === undefined) {
                throw new Error('Signature.v is missing');
            }
        }

        await fixture.coinPairPrice.write.publishPrice(
            [
                msg.version,
                coinPair,
                msg.price,
                msg.votedOracle,
                msg.blockNumber,
                signatures.map((signature) => Number(signature.v)),
                signatures.map((signature) => signature.r),
                signatures.map((signature) => signature.s),
            ],
            { account: publisher.account.account! },
        );
    }

    async function publishRepeatedly(
        fixture: Fixture,
        publisherIndex: number,
        times: number,
        signerCount: number,
    ) {
        for (let i = 0; i < times; i += 1) {
            await publishOnce(fixture, publisherIndex, signerCount);
        }
    }

    async function expectRewardDistribution(
        fixture: Fixture,
        participatingOwners: number[],
        totalPointsOverride?: bigint,
    ) {
        const { coinPairPrice, contracts, oracleData } = fixture;
        const sourceBalance = await coinPairPrice.read.getAvailableRewardFees();
        const ownerBalances = await Promise.all(
            participatingOwners.map((index) =>
                contracts.token.read.balanceOf([oracleData[index].owner.account!.address]),
            ),
        );
        const ownerPoints = await Promise.all(
            participatingOwners.map(async (index) => {
                const info = await coinPairPrice.read.getOracleRoundInfo([
                    oracleData[index].owner.account!.address,
                ]);
                return info[0];
            }),
        );
        const totalPoints =
            totalPointsOverride ?? ownerPoints.reduce((acc, points) => acc + points, 0n);
        const expectedRewards = ownerPoints.map((points) => (points * sourceBalance) / totalPoints);
        const expectedTotalReward = expectedRewards.reduce((acc, reward) => acc + reward, 0n);
        const selectedOracles = (await coinPairPrice.read.getRoundInfo())[5];

        await mineUntilNextRound(fixture.networkHelpers, fixture.viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        for (const selectedOracle of selectedOracles) {
            const info = await coinPairPrice.read.getOracleRoundInfo([selectedOracle]);
            expect(info[0]).to.equal(0n);
        }

        for (const [position, oracleIndex] of participatingOwners.entries()) {
            expect(
                await contracts.token.read.balanceOf([
                    oracleData[oracleIndex].owner.account!.address,
                ]),
            ).to.equal(ownerBalances[position] + expectedRewards[position]);
        }

        expect(await coinPairPrice.read.getAvailableRewardFees()).to.equal(
            sourceBalance - expectedTotalReward,
        );
    }

    it('Points are distributed correctly to 4 owners', async function () {
        const fixture = await buildFixture(4n);
        await registerAndSubscribe(fixture, 4);
        await addFees(fixture);
        await fixture.coinPairPrice.write.switchRound();

        await publishRepeatedly(fixture, 0, 4, 4);
        await publishRepeatedly(fixture, 1, 3, 4);
        await publishRepeatedly(fixture, 2, 2, 4);
        await publishRepeatedly(fixture, 3, 1, 4);

        const roundInfo = await fixture.coinPairPrice.read.getRoundInfo();
        expect(roundInfo[5]).to.have.lengthOf(4);
        for (const oracle of fixture.oracleData) {
            assertAddressInList(roundInfo[5], oracle.address);
        }

        await expectRewardDistribution(fixture, [0, 1, 2, 3]);
    });

    it('Points are distributed correctly to 3 owners', async function () {
        const fixture = await buildFixture(4n);
        await registerAndSubscribe(fixture, 3);
        await addFees(fixture);
        await fixture.coinPairPrice.write.switchRound();

        await publishRepeatedly(fixture, 0, 4, 3);
        await publishRepeatedly(fixture, 1, 3, 3);
        await publishRepeatedly(fixture, 2, 2, 3);

        const roundInfo = await fixture.coinPairPrice.read.getRoundInfo();
        expect(roundInfo[5]).to.have.lengthOf(3);
        for (const oracle of fixture.oracleData.slice(0, 3)) {
            assertAddressInList(roundInfo[5], oracle.address);
        }

        await expectRewardDistribution(fixture, [0, 1, 2]);
    });

    describe('Test with maxOraclesPerRound equal to 3', function () {
        it("Owner is replaced in round for another one and doesn't receive the points", async function () {
            const fixture = await buildFixture(3n);
            await registerAndSubscribe(fixture, 4);
            await addFees(fixture);
            await fixture.coinPairPrice.write.switchRound();

            await publishRepeatedly(fixture, 0, 4, 3);
            await publishRepeatedly(fixture, 1, 3, 3);
            await publishRepeatedly(fixture, 2, 2, 3);

            await fixture.networkHelpers.mine();

            // The legacy test keeps oracle C's points before it leaves the round and uses
            // that value as part of the total-point denominator after the withdraw.
            const ownerPoints3BeforeLeavingRound = (
                await fixture.coinPairPrice.read.getOracleRoundInfo([
                    fixture.oracleData[2].owner.account!.address,
                ])
            )[0];

            const withdrawAmount = (fixture.oracleData[2].stake * 5n) / 6n;
            await fixture.contracts.staking.write.withdraw([withdrawAmount], {
                account: fixture.oracleData[2].owner.account!,
            });
            await fixture.networkHelpers.mine();

            const ownerPoints1 = (
                await fixture.coinPairPrice.read.getOracleRoundInfo([
                    fixture.oracleData[0].owner.account!.address,
                ])
            )[0];
            const ownerPoints2 = (
                await fixture.coinPairPrice.read.getOracleRoundInfo([
                    fixture.oracleData[1].owner.account!.address,
                ])
            )[0];
            const totalPoints = ownerPoints1 + ownerPoints2 + ownerPoints3BeforeLeavingRound;

            await expectRewardDistribution(fixture, [0, 1, 2], totalPoints);
        });
    });
});
