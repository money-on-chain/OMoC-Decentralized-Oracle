/* eslint-disable no-unused-expressions */
/**
 * Tests for the fix in onWithdraw: oracles that are subscribed but NOT selected in the current
 * round are now unsubscribed immediately when their stake drops below the minimum.
 *
 * Bug: onWithdraw() returned early (return 0) for oracles not selected in the current round,
 * without checking whether their stake fell below the minimum. This left them subscribed with
 * zero stake indefinitely, allowing their oracle address to still appear as a valid signer.
 */
import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts } from './helpers.js';
import { ContractOf, Deployer, WalletClient, WalletClients } from 'ts-test-helpers';
import { stringToHex } from 'viem';

type OracleData = {
    name: string;
    stake: bigint;
    owner: WalletClient;
    oracle: WalletClient;
};

describe('CoinPairPrice - onWithdraw unsubscribes subscribed-but-not-selected oracle', function () {
    const coinPairName = 'BTCUSD';
    const coinPair = stringToHex(coinPairName, { size: 32 });
    const minSubscriptionStake = 10n ** 18n;
    const maxOraclesPerRound = 2n;
    const maxSubscribedOraclesPerRound = 10n;
    let oracles: OracleData[];
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairPrice: ContractOf<'CoinPairPrice'>;

    beforeEach(async () => {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
        const governorOwner = accounts[0];

        contracts = await initContracts(deployer, governorOwner, 20n, minSubscriptionStake);
        coinPairPrice = await initCoinpair(
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

        oracles = [
            {
                name: 'oracle-1.io',
                stake: minSubscriptionStake + 3n * 10n ** 18n,
                owner: accounts[2],
                oracle: accounts[3],
            },
            {
                name: 'oracle-2.io',
                stake: minSubscriptionStake + 2n * 10n ** 18n,
                owner: accounts[4],
                oracle: accounts[5],
            },
            {
                name: 'oracle-3.io',
                stake: minSubscriptionStake,
                owner: accounts[6],
                oracle: accounts[7],
            },
        ];
        for (const data of oracles) {
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
            await contracts.staking.write.registerOracle(
                [data.oracle.account!.address, data.name],
                {
                    account: data.owner.account!,
                },
            );
            await contracts.staking.write.subscribeToCoinPair([coinPair], {
                account: data.owner.account!,
            });
        }
        expect(await coinPairPrice.read.isSubscribed([oracles[2].owner.account!.address])).to.equal(
            true,
        );
    });

    it('oracle3 is subscribed but not selected before the fix scenario', async function () {
        const roundInfo = await coinPairPrice.read.getOracleRoundInfo([
            oracles[2].owner.account!.address,
        ]);
        expect(roundInfo[1]).to.equal(false);
    });

    it('oracle3 withdraws all stake and is immediately unsubscribed (fix)', async function () {
        await contracts.staking.write.withdrawAll({ account: oracles[2].owner.account! });

        expect(
            await contracts.staking.read.getBalance([oracles[2].owner.account!.address]),
        ).to.equal(0n);
        expect(await coinPairPrice.read.isSubscribed([oracles[2].owner.account!.address])).to.equal(
            false,
        );
    });

    it('oracle3 withdrawing below minimum stake is unsubscribed immediately', async function () {
        const withdrawAmount = 1n;
        await contracts.staking.write.withdraw([withdrawAmount], {
            account: oracles[2].owner.account!,
        });

        const remaining = await contracts.staking.read.getBalance([
            oracles[2].owner.account!.address,
        ]);
        expect(remaining).to.be.lessThan(Number(minSubscriptionStake));
        expect(await coinPairPrice.read.isSubscribed([oracles[2].owner.account!.address])).to.equal(
            false,
        );
    });
});
