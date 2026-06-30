import { expect } from 'chai';
import { network } from 'hardhat';
import {
    initCoinpair,
    initContracts,
    OracleDefinition,
    OracleStakeData,
    publishPrice,
} from './helpers.js';
import { Deployer, type WalletClients } from 'ts-test-helpers';
import { Address } from 'viem';

function sortByAddressDesc<T extends { address: Address }>(entries: T[]): T[] {
    return [...entries].sort((left, right) => {
        const leftValue = BigInt(left.address);
        const rightValue = BigInt(right.address);

        return leftValue > rightValue ? -1 : leftValue < rightValue ? 1 : 0;
    });
}

function asOracleDefinition(oracle: OracleStakeData): OracleDefinition {
    return {
        owner: oracle.owner,
        signer: oracle.account,
        address: oracle.address,
        name: oracle.name,
    };
}

describe('Staking-withdraw', function () {
    const ORACLE_FEES = (2n * 10n ** 18n) / 10n;
    const ORACLE_STAKE = ORACLE_FEES / 10n;
    const TOKEN_FEES = 100n * 10n ** 18n;
    const governorOwnerIndex = 1;
    const feesAccountIndex = 0;
    const COINPAIR_NAME = 'BTCUSD';
    const MAX_SELECTED_ORACLES = 10n;
    const MAX_SUBSCRIBED_ORACLES = 30n;
    const NUM_ORACLES = 30;

    let deployer: Deployer;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairPrice: Awaited<ReturnType<typeof initCoinpair>>;
    let oracles: OracleStakeData[];

    before(async function () {
        const { viem } = await network.create();
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        if (accounts.length < NUM_ORACLES * 2) {
            throw new Error(
                `Expected at least ${NUM_ORACLES * 2} wallet clients, got ${accounts.length}`,
            );
        }

        contracts = await initContracts(deployer, accounts[governorOwnerIndex], 20n, ORACLE_STAKE);
        coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[governorOwnerIndex].account!.address],
            MAX_SELECTED_ORACLES,
            MAX_SUBSCRIBED_ORACLES,
        );

        await contracts.governor.mint(
            contracts.token.address,
            accounts[feesAccountIndex].account!.address,
            TOKEN_FEES,
        );

        oracles = Array.from({ length: NUM_ORACLES }, (_, i) => {
            const owner = accounts[i];
            const account = accounts[i + NUM_ORACLES];
            const stake = ORACLE_STAKE + BigInt(NUM_ORACLES - i);

            return {
                name: `oracle-${i}`,
                stake,
                account,
                owner,
                address: account.account!.address,
            };
        });

        for (const oracle of oracles) {
            await contracts.governor.mint(
                contracts.token.address,
                oracle.owner.account!.address,
                oracle.stake,
            );
        }
    });

    it('subscription', async function () {
        const coinPairId = await coinPairPrice.read.getCoinPair();

        for (const oracle of oracles) {
            const sender = { account: oracle.owner.account! };
            await contracts.token.write.approve([contracts.staking.address, oracle.stake], sender);
            await contracts.staking.write.registerOracle([oracle.address, oracle.name], sender);
            await contracts.staking.write.deposit(
                [oracle.stake, oracle.owner.account!.address],
                sender,
            );
            await contracts.staking.write.subscribeToCoinPair([coinPairId], sender);
        }

        const selectedOracles = (await coinPairPrice.read.getRoundInfo())[5];
        expect(selectedOracles.length).to.equal(Number(MAX_SELECTED_ORACLES));

        for (let i = 0; i < Number(MAX_SELECTED_ORACLES); i += 1) {
            const oracle = oracles[i];
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
            ).to.equal(true);
            expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
                true,
            );
        }

        for (let i = Number(MAX_SELECTED_ORACLES); i < NUM_ORACLES; i += 1) {
            const oracle = oracles[i];
            expect(
                await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
            ).to.equal(false);
            expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
                true,
            );
        }
    });

    it('withdraw and keep in round', async function () {
        const oracle = oracles[Number(MAX_SELECTED_ORACLES) - 1];

        expect(
            await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
        ).to.equal(true);

        await contracts.staking.write.withdraw([1n], { account: oracle.owner.account! });

        expect(
            await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
        ).to.equal(true);
    });

    it('publish price', async function () {
        await coinPairPrice.write.switchRound();

        const oracle = oracles[Number(MAX_SELECTED_ORACLES) - 1];
        expect(
            await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
        ).to.equal(true);

        const publishingOracles = sortByAddressDesc(
            Array.from({ length: Number(MAX_SELECTED_ORACLES / 2n + 1n) }, (_, i) =>
                asOracleDefinition(oracles[Number(MAX_SELECTED_ORACLES) - 1 - i]),
            ),
        );

        await publishPrice(coinPairPrice, COINPAIR_NAME, 10n ** 18n, publishingOracles);

        const [points] = await coinPairPrice.read.getOracleRoundInfo([
            publishingOracles[0].owner.account!.address,
        ]);
        expect(points).to.equal(1n);
    });

    it('withdraw and drop from round', async function () {
        const oracle = oracles[Number(MAX_SELECTED_ORACLES) - 1];

        await contracts.staking.write.withdraw([1n], { account: oracle.owner.account! });

        expect(
            await coinPairPrice.read.isOracleInCurrentRound([oracle.owner.account!.address]),
        ).to.equal(false);

        const [, , expirations] = await contracts.delayMachine.read.getTransactions([
            oracle.owner.account!.address,
        ]);
        const expirationSecs = expirations[1];
        const stakingLockPeriod = await contracts.staking.read.getWithdrawLockTime();
        const lockPeriodTimestamp = (await coinPairPrice.read.getRoundInfo())[2];

        expect(expirationSecs).to.equal(lockPeriodTimestamp + stakingLockPeriod);

        const [points] = await coinPairPrice.read.getOracleRoundInfo([
            oracle.owner.account!.address,
        ]);
        expect(points).to.equal(0n);
    });

    it('new selected oracle can publish', async function () {
        const newOracle = oracles[Number(MAX_SELECTED_ORACLES)];

        expect(
            await coinPairPrice.read.isOracleInCurrentRound([newOracle.owner.account!.address]),
        ).to.equal(true);

        const publishingOracles = sortByAddressDesc([
            ...Array.from({ length: Number(MAX_SELECTED_ORACLES / 2n) }, (_, i) =>
                asOracleDefinition(oracles[i]),
            ),
            asOracleDefinition(newOracle),
        ]);

        await publishPrice(coinPairPrice, COINPAIR_NAME, 10n ** 18n, publishingOracles);

        const [points] = await coinPairPrice.read.getOracleRoundInfo([
            publishingOracles[0].owner.account!.address,
        ]);
        expect(points).to.equal(1n);
    });
});
