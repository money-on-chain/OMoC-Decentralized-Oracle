import assert from 'node:assert/strict';
import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts, publishPrice, waitForEvents } from './helpers.js';
import { assertSameAddress, Deployer, NetworkHelpers, Viem, WalletClients } from 'ts-test-helpers';
import { hexToBigInt } from 'viem';

describe('CoinPairPrice Emergency Publish', function () {
    let deployer: Deployer;
    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let accounts: WalletClients;

    const emergencyPublishingPeriodInBlocks = 20n;
    const minSubscriptionStake = 10n ** 18n;
    const coinPairName = 'BTCUSD';
    const emergencyPublisher = 7;

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    async function buildFixture() {
        const contracts = await initContracts(deployer, accounts[8], 20n, minSubscriptionStake);
        const coinPairPrice = await initCoinpair(
            deployer,
            coinPairName,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            10n,
            10n,
            60n,
            0n,
            30n,
            emergencyPublishingPeriodInBlocks,
        );

        const change = await deployer.deploy('CoinPairEmergencyWhitelistChange', [
            coinPairPrice.address,
            accounts[emergencyPublisher].account!.address,
        ]);
        await contracts.governor.execute(change);

        return { contracts, coinPairPrice };
    }

    it('Should fail to emergency publish if not whitelisted', async function () {
        const { coinPairPrice } = await buildFixture();
        const notWhitelisted = accounts[1].account!.address;
        assert.notEqual(accounts[emergencyPublisher].account!.address, notWhitelisted);

        await viem.assertions.revertWith(
            coinPairPrice.write.emergencyPublish([1234n], {
                account: accounts[1].account!,
            }),
            'Address is not whitelisted',
        );
    });

    it('Should fail to publish a zero price', async function () {
        const { coinPairPrice } = await buildFixture();

        await viem.assertions.revertWith(
            coinPairPrice.write.emergencyPublish([0n], {
                account: accounts[emergencyPublisher].account!,
            }),
            'Price must be positive and non-zero',
        );
    });

    it('Should fail to publish before emergencyPublishingPeriodInBlocks', async function () {
        const { coinPairPrice } = await buildFixture();

        await viem.assertions.revertWith(
            coinPairPrice.write.emergencyPublish([1234n], {
                account: accounts[emergencyPublisher].account!,
            }),
            "Emergency publish period didn't started",
        );
    });

    it('Should success to emergency publish after emergencyPublishingPeriodInBlocks blocks', async function () {
        const { coinPairPrice } = await buildFixture();
        const previous = await coinPairPrice.read.peek();

        expect(previous[1]).to.equal(true);

        await networkHelpers.mine(Number(emergencyPublishingPeriodInBlocks));
        const tx = await coinPairPrice.write.emergencyPublish([1460n], {
            account: accounts[emergencyPublisher].account!,
        });
        const latestBlock = await viem.getPublicClient().then((pc) => pc.getBlockNumber());
        const event = (await waitForEvents(viem, coinPairPrice, 'EmergencyPricePublished', tx))[0]
            .args;

        assertSameAddress(event.sender, accounts[emergencyPublisher].account!.address);
        expect(event.price).to.equal(1460n);
        assertSameAddress(event.votedOracle, accounts[emergencyPublisher].account!.address);
        expect(event.blockNumber).to.equal(latestBlock);

        const post = await coinPairPrice.read.peek();
        assert.notDeepEqual(previous, post);
        expect(post[1]).to.equal(true);
        expect(hexToBigInt(post[0])).to.equal(1460n);
    });

    it('Should success to emergency publish after a regular publication and emergencyPublishingPeriodInBlocks blocks', async function () {
        const { contracts, coinPairPrice } = await buildFixture();

        const oracles = [
            {
                owner: accounts[0],
                signer: accounts[1],
                address: accounts[1].account!.address,
                name: 'oracle1',
            },
            {
                owner: accounts[2],
                signer: accounts[3],
                address: accounts[3].account!.address,
                name: 'oracle2',
            },
            {
                owner: accounts[4],
                signer: accounts[5],
                address: accounts[5].account!.address,
                name: 'oracle3',
            },
        ];

        const coinPairId = await coinPairPrice.read.getCoinPair();

        for (const oracle of oracles) {
            await contracts.governor.mint(
                contracts.token.address,
                oracle.owner.account!.address,
                minSubscriptionStake,
            );
            await contracts.token.write.approve([contracts.staking.address, minSubscriptionStake], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.deposit(
                [minSubscriptionStake, oracle.owner.account!.address],
                {
                    account: oracle.owner.account!,
                },
            );
            await contracts.staking.write.registerOracle([oracle.address, oracle.name], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.subscribeToCoinPair([coinPairId], {
                account: oracle.owner.account!,
            });
        }

        await coinPairPrice.write.switchRound();
        await publishPrice(coinPairPrice, coinPairName, 1233547895n, oracles);

        await viem.assertions.revertWith(
            coinPairPrice.write.emergencyPublish([1234n], {
                account: accounts[emergencyPublisher].account!,
            }),
            "Emergency publish period didn't started",
        );

        const previous = await coinPairPrice.read.peek();
        expect(previous[1]).to.equal(true);

        await networkHelpers.mine(Number(emergencyPublishingPeriodInBlocks));
        await coinPairPrice.write.emergencyPublish([1460n], {
            account: accounts[emergencyPublisher].account!,
        });

        const post = await coinPairPrice.read.peek();
        assert.notDeepEqual(previous, post);
        expect(post[1]).to.equal(true);
        expect(hexToBigInt(post[0])).to.equal(1460n);
    });
});
