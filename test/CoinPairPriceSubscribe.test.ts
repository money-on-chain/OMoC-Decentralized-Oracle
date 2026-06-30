import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initCoinpair, initContracts, mineUntilNextRound } from './helpers.js';
import {
    Deployer,
    type NetworkHelpers,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';
import type { Address } from 'viem';

type OracleEntry = {
    name: string;
    stake: bigint;
    owner: WalletClient;
    oracle: WalletClient;
    oracleAddr: Address;
};

describe('CoinPairPrice Subscribe', function () {
    const governorOwnerIndex = 8;
    const ownerStartIndex = 10;
    const COINPAIR_NAME = 'BTCUSD';
    const COINPAIR = encodeCoinPair(COINPAIR_NAME);
    const MIN_SUBSCRIPTION_STAKE = 10_000_000_000n;
    const MAX_ORACLES_PER_ROUND = 10n;
    const MAX_SUBSCRIBED_ORACLES_PER_ROUND = 20n;
    const ORACLE_QUANTITY = Number(MAX_SUBSCRIBED_ORACLES_PER_ROUND + 1n);
    const oracleStartIndex = ownerStartIndex + ORACLE_QUANTITY;

    let deployer: Deployer;
    let networkHelpers: NetworkHelpers;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let accounts: WalletClients;

    async function register(
        token: Awaited<ReturnType<typeof initContracts>>['token'],
        staking: Awaited<ReturnType<typeof initContracts>>['staking'],
        oracleMgr: Awaited<ReturnType<typeof initContracts>>['oracleMgr'],
        entry: OracleEntry,
    ) {
        const ownerAddr = entry.owner.account!.address;
        const initialBalance = await token.read.balanceOf([ownerAddr]);

        await token.write.approve([staking.address, entry.stake], {
            account: entry.owner.account!,
        });
        await staking.write.registerOracle([entry.oracleAddr, entry.name], {
            account: entry.owner.account!,
        });
        await staking.write.deposit([entry.stake, ownerAddr], { account: entry.owner.account! });

        const [registeredName, registeredStake] = await oracleMgr.read.getOracleRegistrationInfo([
            ownerAddr,
        ]);
        expect(registeredName).to.equal(entry.name);
        expect(registeredStake).to.equal(entry.stake);
        expect(await token.read.balanceOf([ownerAddr])).to.equal(initialBalance - entry.stake);
    }

    async function buildScenario() {
        const contracts = await initContracts(
            deployer,
            accounts[governorOwnerIndex],
            10n,
            MIN_SUBSCRIPTION_STAKE,
        );
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            MAX_ORACLES_PER_ROUND,
            MAX_SUBSCRIBED_ORACLES_PER_ROUND,
        );

        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(MAX_ORACLES_PER_ROUND);
        expect((await coinPairPrice.read.getRoundInfo())[5].length).to.equal(0);
        expect((await coinPairPrice.read.getRoundInfo())[0]).to.equal(1n);

        const oracleList: OracleEntry[] = [];
        for (let i = 0; i < ORACLE_QUANTITY; i++) {
            const owner = accounts[ownerStartIndex + i];
            const oracle = accounts[oracleStartIndex + i];
            const entry: OracleEntry = {
                name: `ORACLE-${i}`,
                stake: MIN_SUBSCRIPTION_STAKE + BigInt(i) * 100000n,
                owner,
                oracle,
                oracleAddr: oracle.account!.address,
            };

            await contracts.governor.mint(
                contracts.token.address,
                owner.account!.address,
                8n * 10n ** 20n,
            );
            await register(contracts.token, contracts.staking, contracts.oracleMgr, entry);
            oracleList.push(entry);
        }

        return { contracts, coinPairPrice, oracleList };
    }

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        if (accounts.length < oracleStartIndex + ORACLE_QUANTITY) {
            throw new Error(
                `Expected at least ${oracleStartIndex + ORACLE_QUANTITY} wallet clients, got ${accounts.length}`,
            );
        }
    });

    describe('During non zero we add oracles on subscription right away', () => {
        let contracts: Awaited<ReturnType<typeof initContracts>>;
        let coinPairPrice: Awaited<ReturnType<typeof initCoinpair>>;
        let oracleList: OracleEntry[];
        let oracleWithALotOfStake: OracleEntry;
        let oracleWithALessLotOfStake: OracleEntry;
        let oracleWithSmallStake: OracleEntry;

        const getSelectedOracles = async () => (await coinPairPrice.read.getRoundInfo())[5];

        it('Should subscribe oracleCant oracles and the first maxOraclesPerRound goes to current round', async function () {
            ({ contracts, coinPairPrice, oracleList } = await buildScenario());
            expect((await getSelectedOracles()).length).to.equal(0);

            await coinPairPrice.write.switchRound();
            expect((await getSelectedOracles()).length).to.equal(0);

            oracleWithALotOfStake = oracleList[ORACLE_QUANTITY - 1];
            oracleWithALessLotOfStake = oracleList[ORACLE_QUANTITY - 2];
            oracleWithSmallStake = oracleList[2];

            expect((await getSelectedOracles()).length).to.equal(0);

            for (const { owner } of oracleList) {
                const cantPrev = (await getSelectedOracles()).length;

                await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                    account: owner.account!,
                });
                expect(
                    await contracts.oracleMgr.read.isSubscribed([owner.account!.address, COINPAIR]),
                ).to.equal(true);

                const cantPost = (await getSelectedOracles()).length;
                if (cantPrev < Number(MAX_ORACLES_PER_ROUND)) {
                    expect(cantPost).to.equal(cantPrev + 1);
                } else {
                    expect(cantPost).to.equal(Number(MAX_ORACLES_PER_ROUND));
                }
            }

            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleList[0].owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(false);
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleWithALotOfStake.owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);

            await viem.assertions.revertWith(
                contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                    account: oracleList[0].owner.account!,
                }),
                'Not enough stake to add',
            );
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleList[0].owner.account!.address,
                ]),
            ).to.equal(true);
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleWithALotOfStake.owner.account!.address,
                ]),
            ).to.equal(false);

            // Select two cases with different status for the current round
            const idx1 = ORACLE_QUANTITY - Number(MAX_ORACLES_PER_ROUND) - 1;
            const idx2 = ORACLE_QUANTITY - Number(MAX_ORACLES_PER_ROUND) - 2;

            // Both cases are subscribed
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleList[idx1].owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleList[idx2].owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);
            expect(
                await contracts.staking.read.getBalance([oracleList[idx1].owner.account!.address]),
            ).to.equal(oracleList[idx1].stake);
            expect(
                await contracts.staking.read.getBalance([oracleList[idx2].owner.account!.address]),
            ).to.equal(oracleList[idx2].stake);

            // Only the second case was selected for this round
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleList[idx1].owner.account!.address,
                ]),
            ).to.equal(false);
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleList[idx2].owner.account!.address,
                ]),
            ).to.equal(true);

            // Both cases withdraws some amount with different behaviours
            await contracts.staking.write.withdraw([oracleList[idx1].stake], {
                account: oracleList[idx1].owner.account!,
            });
            expect(
                await contracts.staking.read.getBalance([oracleList[idx1].owner.account!.address]),
            ).to.equal(0n);

            await contracts.staking.write.withdraw([oracleList[idx2].stake], {
                account: oracleList[idx2].owner.account!,
            });
            expect(
                await contracts.staking.read.getBalance([oracleList[idx2].owner.account!.address]),
            ).to.equal(0n);

            // First case is unsubscribed and not selected for the current round
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleList[idx1].owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(false);
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleList[idx1].owner.account!.address,
                ]),
            ).to.equal(false);

            // Second case was punished: got unsubscribed and expelled from the round
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleList[idx2].owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(false);
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleList[idx2].owner.account!.address,
                ]),
            ).to.equal(false);

            // The subscribed oracle with the max stake replaced the punished oracle in the current round
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([
                    oracleWithALotOfStake.owner.account!.address,
                ]),
            ).to.equal(true);

            // The oracles are added right away when we saturate the
            // selected list the new ones even if have more stake must wait to next round
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleWithSmallStake.owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);
            expect(
                (await getSelectedOracles()).indexOf(oracleWithSmallStake.oracleAddr) >= 0,
            ).to.equal(false);
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleWithALotOfStake.owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);
            expect(
                (await getSelectedOracles()).indexOf(oracleWithALessLotOfStake.oracleAddr) >= 0,
            ).to.equal(false);

            // It is ok to unsubscribes and subscribes again in the same round
            const { owner, oracleAddr } = oracleWithSmallStake;

            await contracts.staking.write.unSubscribeFromCoinPair([COINPAIR], {
                account: owner.account!,
            });
            expect(
                await contracts.oracleMgr.read.isSubscribed([owner.account!.address, COINPAIR]),
            ).to.equal(false);
            expect((await getSelectedOracles()).indexOf(oracleAddr) >= 0).to.equal(false);
            expect((await getSelectedOracles()).length).to.equal(Number(MAX_ORACLES_PER_ROUND));

            await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: owner.account!,
            });
            expect(
                await contracts.oracleMgr.read.isSubscribed([owner.account!.address, COINPAIR]),
            ).to.equal(true);
            expect((await getSelectedOracles()).indexOf(oracleAddr) >= 0).to.equal(false);
            expect((await getSelectedOracles()).length).to.equal(Number(MAX_ORACLES_PER_ROUND));

            // In the next round ORACLE_WITH_SMALL_STAKE loose his place'
            await mineUntilNextRound(networkHelpers, viem, coinPairPrice);

            await coinPairPrice.write.switchRound();

            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracleWithSmallStake.owner.account!.address,
                    COINPAIR,
                ]),
            ).to.equal(true);
            expect(
                (await getSelectedOracles()).indexOf(oracleWithSmallStake.oracleAddr) >= 0,
            ).to.equal(false);
        });
    });
});
