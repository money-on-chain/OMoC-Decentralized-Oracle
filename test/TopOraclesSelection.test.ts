/**
 * Tests for Top-N registered oracle selection (default top 10, governable in OracleManager).
 *
 * Documented behaviors covered by these tests:
 * 1. Eligibility: An oracle is selected for a round iff it is registered in OracleManager,
 *    subscribed to the coinpair/runner, and within the top `maxOraclesPerRound` registered
 *    operators by stake.
 * 2. Empty slots: Operators outside the top N cannot occupy empty slots on `subscribe()`,
 *    `switchRound()`, or `onWithdraw()`, even if they meet `minCPSubscriptionStake` and are subscribed.
 * 3. Tie-breaking: On equal stake, the operator with the lower `ownerAddr` value takes
 *    precedence. This is deterministic, independent of registration/removal order, and keeps
 *    the top-N set strictly bounded to `maxOraclesPerRound`.
 * 4. Ranking changes:
 *    - Deposits (`Staking.deposit`) do not mutate active rounds; changes take effect on `switchRound()`
 *      (or on `subscribe()` if a newly top-N operator subscribes while the round has empty slots).
 *    - Withdrawals (`Staking.withdraw` -> `onWithdraw`) immediately remove a selected oracle if its
 *      stake drops below `minCPSubscriptionStake` or if it falls out of the global top N. Only an
 *      unselected top-N subscribed oracle can replace it; otherwise the slot remains empty. A
 *      selected oracle that remains in the global top N and above `minCPSubscriptionStake` is not
 *      evicted even if another unselected operator deposited mid-round to outrank it.
 *    - Removals (`removeOracle`) promote the next highest registered operator into the top N,
 *      taking effect on the next `switchRound()`.
 * 5. Auto-unsubscribe floor: `_processAutoUnsubscribeBySignatures` enforces the
 *    `minOraclesPerRound + 1` floor using only eligible (top-N) subscribed oracles so non-top-N
 *    subscribers cannot push active top-N operators below the quorum floor.
 */
import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initCoinpair, initContracts, mineUntilNextRound } from '../src/helpers.js';
import {
    Deployer,
    type ContractOf,
    type NetworkHelpers,
    type Viem,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';
import type { Address } from 'viem';

type OracleEntry = {
    name: string;
    stake: bigint;
    owner: WalletClient;
    oracle: WalletClient;
    ownerAddr: Address;
    oracleAddr: Address;
};

describe('Top-N Registered Oracle Selection', function () {
    const GOVERNOR_INDEX = 1;
    const OWNER_START_INDEX = 5;
    const ORACLE_START_INDEX = 25;
    const COINPAIR_NAME = 'BTCUSD';
    const COINPAIR = encodeCoinPair(COINPAIR_NAME);
    const MIN_STAKE = 10n ** 18n;

    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let deployer: Deployer;
    let accounts: WalletClients;

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    async function registerAndStake(
        contracts: Awaited<ReturnType<typeof initContracts>>,
        idx: number,
        stake: bigint,
    ): Promise<OracleEntry> {
        const owner = accounts[OWNER_START_INDEX + idx];
        const oracle = accounts[ORACLE_START_INDEX + idx];
        const ownerAddr = owner.account!.address;
        const oracleAddr = oracle.account!.address;
        const name = `oracle-${idx}.io`;

        await contracts.governor.mint(contracts.token.address, ownerAddr, stake + 100n * MIN_STAKE);
        await contracts.token.write.approve([contracts.staking.address, stake + 100n * MIN_STAKE], {
            account: owner.account!,
        });
        await contracts.staking.write.registerOracle([oracleAddr, name], {
            account: owner.account!,
        });
        if (stake > 0n) {
            await contracts.staking.write.deposit([stake, ownerAddr], {
                account: owner.account!,
            });
        }

        return { name, stake, owner, oracle, ownerAddr, oracleAddr };
    }

    async function getSelectedOwners(
        coinPairPrice: ContractOf<'CoinPairPrice'>,
    ): Promise<string[]> {
        const [, , , , selectedOwners] = await coinPairPrice.read.getRoundInfo();
        return selectedOwners.map((a) => a.toLowerCase());
    }

    it('enforces registration, subscription, stake ordering, and leaves empty slots when top-10 do not subscribe', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        expect(await contracts.oracleMgr.read.getMaxOraclesPerRound()).to.equal(10n);
        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(10n);

        // Unregistered operator with high stake cannot subscribe
        const unregisteredOwner = accounts[OWNER_START_INDEX + 15];
        await contracts.governor.mint(
            contracts.token.address,
            unregisteredOwner.account!.address,
            50n * MIN_STAKE,
        );
        await contracts.token.write.approve([contracts.staking.address, 50n * MIN_STAKE], {
            account: unregisteredOwner.account!,
        });
        await contracts.staking.write.deposit(
            [50n * MIN_STAKE, unregisteredOwner.account!.address],
            {
                account: unregisteredOwner.account!,
            },
        );
        await viem.assertions.revertWith(
            contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: unregisteredOwner.account!,
            }),
            'Oracle not registered',
        );

        // Register 12 operators with stakes 1..12 MOC (indices 2..11 are top 10; indices 0..1 are outside top 10)
        const oracles: OracleEntry[] = [];
        for (let i = 0; i < 12; i += 1) {
            oracles.push(await registerAndStake(contracts, i, BigInt(i + 1) * MIN_STAKE));
        }

        // Verify top-10 ranking in OracleManager is descending by stake
        const topRegistered = (await contracts.oracleMgr.read.getTopRegisteredOracles()).map((a) =>
            a.toLowerCase(),
        );
        expect(topRegistered.length).to.equal(10);
        for (let rank = 0; rank < 10; rank += 1) {
            expect(topRegistered[rank]).to.equal(oracles[11 - rank].ownerAddr.toLowerCase());
        }
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([oracles[0].ownerAddr]),
        ).to.equal(false);
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([oracles[1].ownerAddr]),
        ).to.equal(false);
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([oracles[2].ownerAddr]),
        ).to.equal(true);

        // Operators #11 and #12 (indices 0, 1) subscribe first while the round is completely empty
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: oracles[0].owner.account!,
        });
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: oracles[1].owner.account!,
        });

        // They are subscribed, but must NOT occupy empty slots in the current round
        expect(
            await contracts.oracleMgr.read.isSubscribed([oracles[0].ownerAddr, COINPAIR]),
        ).to.equal(true);
        expect(
            await contracts.oracleMgr.read.isSubscribed([oracles[1].ownerAddr, COINPAIR]),
        ).to.equal(true);
        expect((await getSelectedOwners(coinPairPrice)).length).to.equal(0);

        // Only 6 of the top 10 subscribe (indices 6..11); indices 2..5 stay unsubscribed
        for (let i = 6; i < 12; i += 1) {
            await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: oracles[i].owner.account!,
            });
        }

        expect(await coinPairPrice.read.isRoundFull()).to.equal(false);
        let selected = await getSelectedOwners(coinPairPrice);
        expect(selected.length).to.equal(6);
        for (let i = 6; i < 12; i += 1) {
            expect(selected).to.include(oracles[i].ownerAddr.toLowerCase());
        }
        expect(selected).to.not.include(oracles[0].ownerAddr.toLowerCase());
        expect(selected).to.not.include(oracles[1].ownerAddr.toLowerCase());

        // After switchRound(), only the 6 subscribed top-10 operators are selected; 4 slots remain empty
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        selected = await getSelectedOwners(coinPairPrice);
        expect(selected.length).to.equal(6);
        expect(await coinPairPrice.read.isRoundFull()).to.equal(false);
        for (let i = 6; i < 12; i += 1) {
            expect(selected).to.include(oracles[i].ownerAddr.toLowerCase());
        }
        expect(selected).to.not.include(oracles[0].ownerAddr.toLowerCase());
        expect(selected).to.not.include(oracles[1].ownerAddr.toLowerCase());
    });

    it('breaks stake ties deterministically by lower owner address', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        // Register 12 operators ALL with the exact same stake (2 MOC)
        const oracles: OracleEntry[] = [];
        for (let i = 0; i < 12; i += 1) {
            oracles.push(await registerAndStake(contracts, i, 2n * MIN_STAKE));
        }

        // Expected order on tie: ascending ownerAddr (lower address wins)
        const sortedByAddress = [...oracles].sort((a, b) =>
            BigInt(a.ownerAddr) < BigInt(b.ownerAddr) ? -1 : 1,
        );

        const topRegistered = (await contracts.oracleMgr.read.getTopRegisteredOracles()).map((a) =>
            a.toLowerCase(),
        );
        expect(topRegistered.length).to.equal(10);
        for (let i = 0; i < 10; i += 1) {
            expect(topRegistered[i]).to.equal(sortedByAddress[i].ownerAddr.toLowerCase());
            expect(
                await contracts.oracleMgr.read.isTopRegisteredOracle([
                    sortedByAddress[i].ownerAddr,
                ]),
            ).to.equal(true);
        }
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([sortedByAddress[10].ownerAddr]),
        ).to.equal(false);
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([sortedByAddress[11].ownerAddr]),
        ).to.equal(false);

        // Even if only the 2 highest-address operators subscribe, they cannot occupy empty slots
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: sortedByAddress[10].owner.account!,
        });
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: sortedByAddress[11].owner.account!,
        });
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        expect((await getSelectedOwners(coinPairPrice)).length).to.equal(0);
    });

    it('handles ranking changes from deposits, withdrawals, oracle removals, and governance updates', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            4n, // Governable top-4 for concise scenario
        );

        // Register 6 operators with stakes 1..6 MOC. Top 4 are indices 2, 3, 4, 5.
        const oracles: OracleEntry[] = [];
        for (let i = 0; i < 6; i += 1) {
            oracles.push(await registerAndStake(contracts, i, BigInt(i + 1) * MIN_STAKE));
        }

        // Subscribe indices 0 (stake 1), 1 (stake 2), 3 (stake 4), 4 (stake 5), 5 (stake 6).
        // Index 2 (stake 3, #4) intentionally stays UNSUBSCRIBED to test empty slot behavior.
        for (const idx of [0, 1, 3, 4, 5]) {
            await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: oracles[idx].owner.account!,
            });
        }

        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        // Only top-4 subscribed (indices 3, 4, 5) are selected; 1 slot stays empty
        let selected = await getSelectedOwners(coinPairPrice);
        expect(selected.length).to.equal(3);
        expect(selected).to.have.members([
            oracles[3].ownerAddr.toLowerCase(),
            oracles[4].ownerAddr.toLowerCase(),
            oracles[5].ownerAddr.toLowerCase(),
        ]);

        // 1. Deposit: index 1 (stake 2 -> 10 MOC) overtakes into #1, does NOT enter mid-round
        await contracts.staking.write.deposit([8n * MIN_STAKE, oracles[1].ownerAddr], {
            account: oracles[1].owner.account!,
        });
        expect(await coinPairPrice.read.isOracleInCurrentRound([oracles[1].ownerAddr])).to.equal(
            false,
        );

        // Next switchRound picks up the new ranking: top 4 are now indices 1(10), 5(6), 4(5), 3(4)
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();
        selected = await getSelectedOwners(coinPairPrice);
        expect(selected).to.have.members([
            oracles[1].ownerAddr.toLowerCase(),
            oracles[5].ownerAddr.toLowerCase(),
            oracles[4].ownerAddr.toLowerCase(),
            oracles[3].ownerAddr.toLowerCase(),
        ]);

        // 2. Withdraw out of top-4 while still >= minStake:
        // index 3 (stake 4) withdraws 2 MOC -> stake 2 MOC, dropping below unsubscribed index 2 (stake 3 MOC).
        // Index 3 must be removed immediately and leave an empty slot (index 0 with stake 1 must NOT replace it).
        await contracts.staking.write.withdraw([2n * MIN_STAKE], {
            account: oracles[3].owner.account!,
        });
        expect(await coinPairPrice.read.isOracleInCurrentRound([oracles[3].ownerAddr])).to.equal(
            false,
        );
        expect(await coinPairPrice.read.isOracleInCurrentRound([oracles[0].ownerAddr])).to.equal(
            false,
        );
        expect((await getSelectedOwners(coinPairPrice)).length).to.equal(3);

        // 3. Remove oracle: unsubscribed index 2 (stake 3 MOC) is removed -> index 3 (stake 2 MOC) re-enters top 4
        await contracts.staking.write.removeOracle({ account: oracles[2].owner.account! });
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();
        expect(await coinPairPrice.read.isOracleInCurrentRound([oracles[3].ownerAddr])).to.equal(
            true,
        );

        // 4. Governance reduces maxOraclesPerRound from 4 to 2 -> next switchRound selects only top 2 (indices 1 and 5)
        await contracts.governor.setMaxOraclesPerRound(contracts.oracleMgr, 2n);
        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(2n);
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();
        selected = await getSelectedOwners(coinPairPrice);
        expect(selected).to.have.members([
            oracles[1].ownerAddr.toLowerCase(),
            oracles[5].ownerAddr.toLowerCase(),
        ]);
    });

    it('counts only eligible top-N subscribed oracles for the auto-unsubscribe floor', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        // Registry default minOraclesPerRound is 3, so auto-unsubscribe floor is 3 + 1 = 4.
        // Set maxOraclesPerRound = 4 and maxMissedSigRounds = 1.
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            4n,
            20n,
            60n,
            1n, // maxMissedSigRounds = 1
        );

        // Register 6 operators: indices 2..5 are top 4; indices 0..1 are outside top 4.
        const oracles: OracleEntry[] = [];
        for (let i = 0; i < 6; i += 1) {
            oracles.push(await registerAndStake(contracts, i, BigInt(i + 1) * MIN_STAKE));
        }

        // Subscribe all 6 (total subscribed = 6 > 4, but eligible top-4 subscribed = 4 <= 4).
        for (const entry of oracles) {
            await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: entry.owner.account!,
            });
        }

        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        // Advance another round with zero signatures -> auto-unsubscribe must NOT trigger
        // because eligibleSubscribedCount (4) <= minOraclesPerRound + 1 (4).
        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        for (let i = 2; i < 6; i += 1) {
            expect(
                await contracts.oracleMgr.read.isSubscribed([oracles[i].ownerAddr, COINPAIR]),
            ).to.equal(true);
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([oracles[i].ownerAddr]),
            ).to.equal(true);
        }
    });

    it('bounds registeredOracles to maxRegisteredOracles, evicting lowest-stake removable operator only', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            2n, // maxOraclesPerRound = 2
            4n, // maxRegisteredOracles = 4
        );

        // Register 4 operators: 2 with stake (2, 3 MOC) and 2 with 0 stake (squatters)
        const staked1 = await registerAndStake(contracts, 0, 2n * MIN_STAKE);
        const staked2 = await registerAndStake(contracts, 1, 3n * MIN_STAKE);
        const squatter1 = await registerAndStake(contracts, 2, 0n);
        const squatter2 = await registerAndStake(contracts, 3, 0n);

        // Subscribe staked1 and staked2 so both are selected in the active round
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: staked1.owner.account!,
        });
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: staked2.owner.account!,
        });
        expect(await contracts.oracleMgr.read.getRegisteredOraclesLen()).to.equal(4n);

        // A 0-stake spammer cannot register once the cap is full
        const spammerOwner = accounts[OWNER_START_INDEX + 4];
        const spammerOracle = accounts[ORACLE_START_INDEX + 4];
        await viem.assertions.revertWith(
            contracts.staking.write.registerOracle([spammerOracle.account!.address, 'spam.io'], {
                account: spammerOwner.account!,
            }),
            'Not enough stake to register',
        );

        // A new operator with stake > 0 evicts one of the 0-stake squatters (higher address first on tie)
        const newcomerOwner = accounts[OWNER_START_INDEX + 5];
        const newcomerOracle = accounts[ORACLE_START_INDEX + 5];
        await contracts.governor.mint(
            contracts.token.address,
            newcomerOwner.account!.address,
            MIN_STAKE,
        );
        await contracts.token.write.approve([contracts.staking.address, MIN_STAKE], {
            account: newcomerOwner.account!,
        });
        await contracts.staking.write.deposit([MIN_STAKE, newcomerOwner.account!.address], {
            account: newcomerOwner.account!,
        });
        await contracts.staking.write.registerOracle(
            [newcomerOracle.account!.address, 'newcomer.io'],
            { account: newcomerOwner.account! },
        );

        expect(await contracts.oracleMgr.read.getRegisteredOraclesLen()).to.equal(4n);
        expect(
            await contracts.oracleMgr.read.isRegistered([newcomerOwner.account!.address]),
        ).to.equal(true);
        const expectedEvicted =
            BigInt(squatter1.ownerAddr) > BigInt(squatter2.ownerAddr) ? squatter1 : squatter2;
        expect(await contracts.oracleMgr.read.isRegistered([expectedEvicted.ownerAddr])).to.equal(
            false,
        );
        // Selected round operators remain untouched
        expect(await coinPairPrice.read.isOracleInCurrentRound([staked1.ownerAddr])).to.equal(true);
        expect(await coinPairPrice.read.isOracleInCurrentRound([staked2.ownerAddr])).to.equal(true);
    });

    it('enforces governance bounds on maxOraclesPerRound and maxRegisteredOracles', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        expect(await contracts.oracleMgr.read.getMaxOraclesPerRound()).to.equal(10n);
        expect(await contracts.oracleMgr.read.getMaxRegisteredOracles()).to.equal(20n);
        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(10n);
        expect(await coinPairPrice.read.getMaxSubscribedOraclesPerRound()).to.equal(20n);

        await viem.assertions.revertWith(
            contracts.governor.setMaxOraclesPerRound(contracts.oracleMgr, 0n),
            'The maximum oracles per round must be >0',
        );
        await viem.assertions.revertWith(
            contracts.governor.setMaxOraclesPerRound(contracts.oracleMgr, 21n),
            'Max oracles per round must be <= max registered oracles',
        );
        await viem.assertions.revertWith(
            contracts.governor.setMaxRegisteredOracles(contracts.oracleMgr, 9n),
            'Max registered oracles must be >= max oracles per round',
        );

        await contracts.governor.setMaxRegisteredOracles(contracts.oracleMgr, 15n);
        await contracts.governor.setMaxOraclesPerRound(contracts.oracleMgr, 7n);

        expect(await contracts.oracleMgr.read.getMaxRegisteredOracles()).to.equal(15n);
        expect(await contracts.oracleMgr.read.getMaxOraclesPerRound()).to.equal(7n);
        expect(await coinPairPrice.read.getMaxSubscribedOraclesPerRound()).to.equal(15n);
        expect(await coinPairPrice.read.maxOraclesPerRound()).to.equal(7n);
    });

    it('does not evict a selected oracle on partial withdraw if it remains in top-N despite a mid-round deposit', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            4n, // maxOraclesPerRound = 4
            10n,
        );

        // Register 5 operators: O1(10), O2(20), O3(30), O4(40), O5(5)
        const o1 = await registerAndStake(contracts, 0, 10n * MIN_STAKE);
        const o2 = await registerAndStake(contracts, 1, 20n * MIN_STAKE);
        const o3 = await registerAndStake(contracts, 2, 30n * MIN_STAKE);
        const o4 = await registerAndStake(contracts, 3, 40n * MIN_STAKE);
        const o5 = await registerAndStake(contracts, 4, 5n * MIN_STAKE);

        for (const entry of [o1, o2, o3, o4, o5]) {
            await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
                account: entry.owner.account!,
            });
        }

        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();

        // Active round has top-4: [O4(40), O3(30), O2(20), O1(10)]; O5(5) is outside
        expect(await coinPairPrice.read.isOracleInCurrentRound([o4.ownerAddr])).to.equal(true);
        expect(await coinPairPrice.read.isOracleInCurrentRound([o5.ownerAddr])).to.equal(false);

        // Mid-round: O5 deposits 95 MOC -> 100 MOC (#1), pushing O1(10) to #5
        await contracts.staking.write.deposit([95n * MIN_STAKE, o5.ownerAddr], {
            account: o5.owner.account!,
        });

        // O4 withdraws 1 MOC -> 39 MOC (still #2 in global top-4 and >= minStake)
        await contracts.staking.write.withdraw([MIN_STAKE], {
            account: o4.owner.account!,
        });

        // O4 MUST remain selected in the current round (not evicted by O5)
        expect(await coinPairPrice.read.isOracleInCurrentRound([o4.ownerAddr])).to.equal(true);
        expect(await coinPairPrice.read.isOracleInCurrentRound([o5.ownerAddr])).to.equal(false);
    });

    it('excludes registered operators below minCPSubscriptionStake from top-N eligibility', async function () {
        const contracts = await initContracts(deployer, accounts[GOVERNOR_INDEX], 20n, MIN_STAKE);
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        const validOracle = await registerAndStake(contracts, 0, 2n * MIN_STAKE);
        const zeroStakeOracle = await registerAndStake(contracts, 1, 0n);

        // Even with <= 10 registered, 0-stake operator is excluded from top-N
        const top = (await contracts.oracleMgr.read.getTopRegisteredOracles()).map((a) =>
            a.toLowerCase(),
        );
        expect(top).to.deep.equal([validOracle.ownerAddr.toLowerCase()]);
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([validOracle.ownerAddr]),
        ).to.equal(true);
        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([zeroStakeOracle.ownerAddr]),
        ).to.equal(false);

        // Subscribe validOracle, then raise minCPSubscriptionStake above its stake -> excluded on switchRound
        await contracts.staking.write.subscribeToCoinPair([COINPAIR], {
            account: validOracle.owner.account!,
        });
        expect(await coinPairPrice.read.isOracleInCurrentRound([validOracle.ownerAddr])).to.equal(
            true,
        );

        const minStakeChange = await deployer.deploy('OracleManagerOracleMinStakeChange', [
            contracts.oracleMgr.address,
            5n * MIN_STAKE,
        ]);
        await contracts.governor.execute(minStakeChange);

        expect(
            await contracts.oracleMgr.read.isTopRegisteredOracle([validOracle.ownerAddr]),
        ).to.equal(false);
        expect((await contracts.oracleMgr.read.getTopRegisteredOracles()).length).to.equal(0);

        await mineUntilNextRound(networkHelpers, viem, coinPairPrice);
        await coinPairPrice.write.switchRound();
        expect((await getSelectedOwners(coinPairPrice)).length).to.equal(0);
    });
});
