import assert from 'node:assert/strict';
import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initCoinpair, initContracts } from './helpers.js';
import { Deployer } from 'ts-test-helpers';

describe('OracleManager by gobernanza', function () {
    const minOracleOwnerStake = 10n ** 18n;
    const period = 20n;
    const coinPair = encodeCoinPair('BTCUSD');

    async function setupFixture() {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const governorOwner = accounts[8];
        const whitelistedCaller = accounts[9];
        const contracts = await initContracts(
            deployer,
            governorOwner,
            period,
            minOracleOwnerStake,
            [whitelistedCaller.account!.address],
        );
        const coinPairPrice = await initCoinpair(
            deployer,
            'BTCUSD',
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        const oracle = {
            name: 'oracle-a.io',
            stake: minOracleOwnerStake + 4n * 10n ** 18n,
            account: accounts[1],
            owner: accounts[2],
        };

        await contracts.governor.mint(
            contracts.token.address,
            accounts[0].account!.address,
            800000000000000000000n,
        );
        await contracts.governor.mint(
            contracts.token.address,
            oracle.owner.account!.address,
            800000000000000000000n,
        );

        return {
            viem,
            deployer,
            accounts,
            contracts,
            coinPairPrice,
            oracle,
            whitelistedCaller,
        };
    }

    it('Registration and subscription', async function () {
        const { contracts, coinPairPrice, oracle, whitelistedCaller } = await setupFixture();

        await contracts.token.write.approve([contracts.staking.address, oracle.stake], {
            account: oracle.owner.account!,
        });
        await contracts.staking.write.deposit([oracle.stake, oracle.owner.account!.address], {
            account: oracle.owner.account!,
        });

        await contracts.oracleMgr.write.registerOracle(
            [oracle.owner.account!.address, oracle.account.account!.address, oracle.name],
            { account: whitelistedCaller.account! },
        );

        const info0 = await contracts.oracleMgr.read.getOracleRegistrationInfo([
            oracle.owner.account!.address,
        ]);
        assert.equal(info0[0], oracle.name);

        await contracts.oracleMgr.write.subscribeToCoinPair(
            [oracle.owner.account!.address, coinPair],
            { account: whitelistedCaller.account! },
        );
        expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
            true,
        );
        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracle.owner.account!.address]),
        ).to.equal(true);
    });

    it('Should fail to unsubscribe oracle if not called by owner', async function () {
        const { viem, contracts, accounts } = await setupFixture();

        await viem.assertions.revertWith(
            contracts.oracleMgr.write.unSubscribeFromCoinPair(
                [accounts[2].account!.address, coinPair],
                { account: accounts[0].account! },
            ),
            'Address is not whitelisted',
        );
    });

    it('Unsubscribe by gobernanza', async function () {
        const { contracts, coinPairPrice, oracle, whitelistedCaller, deployer } =
            await setupFixture();

        await contracts.token.write.approve([contracts.staking.address, oracle.stake], {
            account: oracle.owner.account!,
        });
        await contracts.staking.write.deposit([oracle.stake, oracle.owner.account!.address], {
            account: oracle.owner.account!,
        });
        await contracts.oracleMgr.write.registerOracle(
            [oracle.owner.account!.address, oracle.account.account!.address, oracle.name],
            { account: whitelistedCaller.account! },
        );
        await contracts.oracleMgr.write.subscribeToCoinPair(
            [oracle.owner.account!.address, coinPair],
            { account: whitelistedCaller.account! },
        );

        const change = await deployer.deploy('OracleManagerUnsubscribeChange', [
            contracts.oracleMgr.address,
            oracle.owner.account!.address,
            coinPair,
        ]);
        await contracts.governor.execute(change);

        expect(await coinPairPrice.read.isSubscribed([oracle.owner.account!.address])).to.equal(
            false,
        );
        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracle.owner.account!.address]),
        ).to.equal(true);
    });

    it('Should fail to remove oracle if not called by owner', async function () {
        const { viem, contracts, accounts } = await setupFixture();

        await viem.assertions.revertWith(
            contracts.oracleMgr.write.removeOracle([accounts[2].account!.address], {
                account: accounts[0].account!,
            }),
            'Address is not whitelisted',
        );
    });

    it('Remove by gobernanza', async function () {
        const { contracts, oracle, whitelistedCaller, deployer } = await setupFixture();

        await contracts.token.write.approve([contracts.staking.address, oracle.stake], {
            account: oracle.owner.account!,
        });
        await contracts.staking.write.deposit([oracle.stake, oracle.owner.account!.address], {
            account: oracle.owner.account!,
        });
        await contracts.oracleMgr.write.registerOracle(
            [oracle.owner.account!.address, oracle.account.account!.address, oracle.name],
            { account: whitelistedCaller.account! },
        );

        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracle.owner.account!.address]),
        ).to.equal(true);
        await contracts.staking.write.withdraw([oracle.stake], { account: oracle.owner.account! });
        expect(await contracts.staking.read.getBalance([oracle.owner.account!.address])).to.equal(
            0n,
        );

        const change = await deployer.deploy('OracleManagerRemoveChange', [
            contracts.oracleMgr.address,
            oracle.owner.account!.address,
        ]);
        await contracts.governor.execute(change);

        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracle.owner.account!.address]),
        ).to.equal(false);
    });
});
