import { expect } from 'chai';
import { network } from 'hardhat';
import { Deployer } from 'ts-test-helpers';

import { addressFromNumber } from './helpers.js';

const NUM_ORACLES = 50n;
const MAX_SUBSCRIBED_ORACLES = 30n;
const MAX_SELECTED_ORACLES = 10n;

function randomAddress(): string {
    return addressFromNumber(Math.round(Math.random() * 100));
}

function randomStake(): bigint {
    return BigInt(Math.round(Math.random() * 10));
}

describe('SubscribedOracles', function () {
    let deployer: Deployer;
    let oracles: Record<string, bigint>;

    beforeEach(async function () {
        const { viem } = await network.create();
        deployer = await Deployer.default(viem);

        oracles = {};

        for (let i = 0; i < NUM_ORACLES; i += 1) {
            oracles[randomAddress()] = randomStake();
        }
    });

    async function deploySubscribedOracles(maxSubscribedOracles = MAX_SUBSCRIBED_ORACLES) {
        const subscribedOracles = await deployer.deploy('SubscribedOraclesMock', [
            maxSubscribedOracles,
        ]);

        expect(subscribedOracles).to.not.be.undefined;

        return subscribedOracles;
    }

    async function addOracles(subscribedOracles: any) {
        for (const [oracle, stake] of Object.entries(oracles)) {
            await subscribedOracles.write.addOrReplace([oracle, stake]);
        }
    }

    it('creation', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        const length = await subscribedOracles.read.length();

        expect(length).to.equal(0n);
    });

    it('add', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        expect(await subscribedOracles.read.length()).to.equal(BigInt(MAX_SUBSCRIBED_ORACLES));
    });

    it('sort', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        let selected = await subscribedOracles.read.sort([MAX_SUBSCRIBED_ORACLES]);

        expect(selected.length).to.equal(Number(MAX_SUBSCRIBED_ORACLES));

        let stake = oracles[selected[0]];
        let i = 1;

        while (i < selected.length) {
            const next = oracles[selected[i]];

            expect(Number(stake), 'Stake should be in decreasing order').to.be.greaterThanOrEqual(
                Number(next),
            );

            stake = next;
            i += 1;
        }

        selected = await subscribedOracles.read.sort([MAX_SELECTED_ORACLES]);

        expect(selected.length).to.equal(Number(MAX_SELECTED_ORACLES));

        stake = oracles[selected[0]];
        i = 1;

        while (i < selected.length) {
            const next = oracles[selected[i]];

            expect(Number(stake), 'Stake should be in decreasing order').to.be.greaterThanOrEqual(
                Number(next),
            );

            stake = next;
            i += 1;
        }
    });

    it('sort - gas', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        await subscribedOracles.write.sortForGas([MAX_SELECTED_ORACLES]);
    });

    it('remove', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        const length = await subscribedOracles.read.length();
        const selected = await subscribedOracles.read.sort([MAX_SELECTED_ORACLES]);

        for (const oracle of selected) {
            await subscribedOracles.write.remove([oracle]);
        }

        expect(await subscribedOracles.read.length()).to.equal(length - BigInt(selected.length));
    });

    it('minimum', async function () {
        const subscribedOracles = await deploySubscribedOracles(5n);

        for (let i = 1; i <= 5; i += 1) {
            const oracle = addressFromNumber(i);

            await subscribedOracles.write.addOrReplace([oracle, BigInt(i)]);
        }

        const [minStake, minAddress] = await subscribedOracles.read.getMin();

        expect(minStake).to.equal(1n);
        expect(minAddress).to.equal(addressFromNumber(1));
    });

    it('on withdraw', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        await subscribedOracles.write.selectOracles([MAX_SELECTED_ORACLES]);

        const selected = await subscribedOracles.read.getSelectedOracles();

        for (let i = 0; i < selected.length; i += 1) {
            await subscribedOracles.write.onWithdraw([selected[i], i % 2 !== 0]);
        }
    });
});
