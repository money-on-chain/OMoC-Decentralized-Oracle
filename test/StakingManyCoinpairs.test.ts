import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initCoinpair, initContracts } from './helpers.js';
import {
    assertSameAddress,
    Deployer,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';

type OracleEntry = {
    name: string;
    stake: bigint;
    owner: WalletClient;
    oracle: WalletClient;
};

describe('Staking-withdraw with many coin pairs', function () {
    const feesAccountIndex = 1;
    const governorOwnerIndex = 8;
    const ownerStartIndex = 10;
    const oracleStartIndex = 30;
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = 10n ** 18n;
    const MAX_SELECTED_ORACLES = 10n;
    const NUM_SUBSCRIBED_ORACLES = 30;
    const NUM_ORACLES = 30;
    const NUM_COINPAIR = Number(process.env.COINPAIRS ?? 4);

    let deployer: Deployer;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairs: Awaited<ReturnType<typeof initCoinpair>>[];
    let oracles: OracleEntry[];

    before(async function () {
        const { viem } = await network.create();
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        if (accounts.length < oracleStartIndex + NUM_ORACLES) {
            throw new Error(
                `Expected at least ${oracleStartIndex + NUM_ORACLES} wallet clients, got ${accounts.length}`,
            );
        }

        contracts = await initContracts(deployer, accounts[governorOwnerIndex], 20n, ORACLE_STAKE);

        coinPairs = [];
        for (let i = 0; i < NUM_COINPAIR; i += 1) {
            const coinPair = await initCoinpair(
                deployer,
                `${COINPAIR_NAME}${i}`,
                contracts.governor,
                contracts.token,
                contracts.oracleMgr,
                contracts.registry,
                [accounts[governorOwnerIndex].account!.address],
                MAX_SELECTED_ORACLES,
                BigInt(NUM_SUBSCRIBED_ORACLES),
            );
            coinPairs.push(coinPair);
        }

        await contracts.governor.mint(
            contracts.token.address,
            accounts[feesAccountIndex].account!.address,
            100n * 10n ** 18n,
        );

        oracles = Array.from({ length: NUM_ORACLES }, (_, i) => ({
            name: `oracle-${i}`,
            stake: ORACLE_STAKE + BigInt(i),
            owner: accounts[ownerStartIndex + i],
            oracle: accounts[oracleStartIndex + i],
        }));

        for (const oracle of oracles) {
            await contracts.governor.mint(
                contracts.token.address,
                oracle.owner.account!.address,
                oracle.stake,
            );
            await contracts.token.write.approve([contracts.staking.address, oracle.stake], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.registerOracle(
                [oracle.oracle.account!.address, oracle.name],
                {
                    account: oracle.owner.account!,
                },
            );
            await contracts.staking.write.deposit([oracle.stake, oracle.owner.account!.address], {
                account: oracle.owner.account!,
            });
        }
    });

    it('coinPairs query info', async function () {
        const numCoinPair = await contracts.staking.read.getCoinPairCount();
        expect(numCoinPair).to.equal(BigInt(NUM_COINPAIR));

        for (let i = 0; i < NUM_COINPAIR; i += 1) {
            const coinPairId = await contracts.staking.read.getCoinPairAtIndex([BigInt(i)]);
            expect(coinPairId).to.equal(encodeCoinPair(`${COINPAIR_NAME}${i}`));

            const coinPairAddress = await contracts.staking.read.getContractAddress([coinPairId]);
            assertSameAddress(coinPairAddress, coinPairs[i].address);

            const coinPairIndex = await contracts.staking.read.getCoinPairIndex([coinPairId, 0n]);
            expect(coinPairIndex).to.equal(BigInt(i));
        }
    });

    it('subscription', async function () {
        for (const oracle of oracles) {
            for (const coinPair of coinPairs) {
                await contracts.staking.write.subscribeToCoinPair(
                    [await coinPair.read.getCoinPair()],
                    {
                        account: oracle.owner.account!,
                    },
                );
            }
        }

        const selectedOracles = (await coinPairs[0].read.getRoundInfo())[5];
        expect(selectedOracles.length).to.equal(Number(MAX_SELECTED_ORACLES));
    });

    it('withdraw', async function () {
        const coinPair = coinPairs[0];
        const oracleOwner = oracles[0].owner.account!.address;

        expect(await coinPair.read.isOracleInCurrentRound([oracleOwner])).to.equal(true);
        await contracts.staking.write.withdraw([1n], { account: oracles[0].owner.account! });
        expect(await coinPair.read.isOracleInCurrentRound([oracleOwner])).to.equal(false);

        const newSelectedOwner = oracles[NUM_ORACLES - 1].owner.account!.address;
        expect(await coinPair.read.isOracleInCurrentRound([newSelectedOwner])).to.equal(true);
    });
});
