import assert from 'node:assert/strict';
import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts } from './helpers.js';
import { ContractOf, Deployer, type WalletClient, type WalletClients } from 'ts-test-helpers';

type OracleEntry = {
    name: string;
    stake: bigint;
    owner: WalletClient;
    oracle: WalletClient;
};

describe('Staking-subscriptions', function () {
    const mocAccountIndex = 2;
    const governorOwnerIndex = 8;
    const ownerStartIndex = 10;
    const oracleStartIndex = 30;
    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_STAKE = 10n ** 18n;
    const MAX_SELECTED_ORACLES = 5n;
    const MAX_SUBSCRIBED_ORACLES = 10n;
    const NUM_ORACLES = 15;
    const MAX_STAKE = ORACLE_STAKE * BigInt(NUM_ORACLES) * 2n;

    let deployer: Deployer;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairPrice: ContractOf<'CoinPairPrice'>;
    let oracles: OracleEntry[];

    beforeEach(async function () {
        const { viem } = await network.create();
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        if (accounts.length < oracleStartIndex + NUM_ORACLES) {
            throw new Error(
                `Expected at least ${oracleStartIndex + NUM_ORACLES} wallet clients, got ${accounts.length}`,
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
            accounts[mocAccountIndex].account!.address,
            MAX_STAKE,
        );

        oracles = Array.from({ length: NUM_ORACLES }, (_, i) => ({
            name: `oracle-${i}`,
            stake: ORACLE_STAKE + BigInt(i),
            owner: accounts[ownerStartIndex + i],
            oracle: accounts[oracleStartIndex + i],
        }));
    });

    async function prepareOracle(entry: OracleEntry) {
        await contracts.token.write.transfer([entry.owner.account!.address, entry.stake], {
            account: accounts[mocAccountIndex].account!,
        });
        await contracts.token.write.approve([contracts.staking.address, entry.stake], {
            account: entry.owner.account!,
        });
        await contracts.staking.write.registerOracle([entry.oracle.account!.address, entry.name], {
            account: entry.owner.account!,
        });
        await contracts.staking.write.deposit([entry.stake, entry.owner.account!.address], {
            account: entry.owner.account!,
        });
    }

    async function setupInitialSubscriptions() {
        const coinPairId = await coinPairPrice.read.getCoinPair();

        for (let i = 0; i < NUM_ORACLES; i += 1) {
            await prepareOracle(oracles[i]);
        }

        for (let i = 0; i < Number(MAX_SUBSCRIBED_ORACLES); i += 1) {
            await contracts.staking.write.subscribeToCoinPair([coinPairId], {
                account: oracles[i].owner.account!,
            });
        }

        return coinPairId;
    }

    it('subscription - new', async function () {
        const coinPairId = await setupInitialSubscriptions();

        expect(await coinPairPrice.read.isRoundFull()).to.equal(true);

        for (let i = 0; i < Number(MAX_SUBSCRIBED_ORACLES); i += 1) {
            const oracle = oracles[i];
            expect(
                await contracts.oracleMgr.read.isSubscribed([
                    oracle.owner.account!.address,
                    coinPairId,
                ]),
            ).to.equal(true);
        }
    });

    it('subscription - replacing low stakes', async function () {
        const coinPairId = await setupInitialSubscriptions();

        for (let i = Number(MAX_SUBSCRIBED_ORACLES); i < NUM_ORACLES; i += 1) {
            const oracle = oracles[i];
            const toRemove = oracles[i - Number(MAX_SUBSCRIBED_ORACLES)];

            expect(
                await coinPairPrice.read.isSubscribed([toRemove.owner.account!.address]),
            ).to.equal(true);
            expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
                false,
            );

            await contracts.staking.write.subscribeToCoinPair([coinPairId], {
                account: oracle.owner.account!,
            });

            expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
                true,
            );
            expect(
                await coinPairPrice.read.isSubscribed([toRemove.owner.account!.address]),
            ).to.equal(false);
        }
    });

    it('removing oracle', async function () {
        const oracle = oracles[0];
        await prepareOracle(oracle);
        const stake = await contracts.staking.read.getBalance([oracle.owner.account!.address]);
        await contracts.staking.write.withdraw([stake], { account: oracle.owner.account! });
        assert.equal(
            (await contracts.staking.read.getBalance([oracle.owner.account!.address])).toString(),
            '0',
        );

        expect(
            await contracts.oracleMgr.read.canRemoveOracle([oracle.owner.account!.address]),
        ).to.equal(true);
        await contracts.staking.write.removeOracle({ account: oracle.owner.account! });
    });

    it('change oracle url', async function () {
        const oracle = oracles[1];
        await prepareOracle(oracle);
        const oldInfo = await contracts.oracleMgr.read.getOracleRegistrationInfo([
            oracle.owner.account!.address,
        ]);
        const newURL = 'https://example.org/newURL';
        expect(oldInfo[0]).to.not.equal(newURL);

        await contracts.staking.write.setOracleName([newURL], { account: oracle.owner.account! });

        const updatedInfo = await contracts.oracleMgr.read.getOracleRegistrationInfo([
            oracle.owner.account!.address,
        ]);
        expect(updatedInfo[0]).to.equal(newURL);
    });
});
