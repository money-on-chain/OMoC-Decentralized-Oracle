import { expect } from 'chai';
import { network } from 'hardhat';
import { getAddress, hexlify, randomBytes, toBeHex, zeroPadValue } from 'ethers';

const NUM_ORACLES = 50;
const MAX_SUBSCRIBED_ORACLES = 30;
const MAX_SELECTED_ORACLES = 10;

function addressFromNumber(value: number): string {
    return getAddress(zeroPadValue(toBeHex(value), 20));
}

function randomAddress(): string {
    return getAddress(hexlify(randomBytes(20)));
}

function randomStake(): bigint {
    return BigInt(randomBytes(1)[0]);
}

describe('SubscribedOracles', function () {
    let ethers: Awaited<ReturnType<typeof network.create>>['ethers'];

    let oracles: Record<string, bigint>;

    beforeEach(async function () {
        ({ ethers } = await network.create());

        oracles = {};

        for (let i = 0; i < NUM_ORACLES; i += 1) {
            oracles[randomAddress()] = randomStake();
        }
    });

    async function deploySubscribedOracles(maxSubscribedOracles = MAX_SUBSCRIBED_ORACLES) {
        const SubscribedOraclesMock = await ethers.getContractFactory('SubscribedOraclesMock');
        const subscribedOracles = await SubscribedOraclesMock.deploy(maxSubscribedOracles);

        expect(subscribedOracles).to.not.be.undefined;

        return subscribedOracles;
    }

    async function addOracles(subscribedOracles: any) {
        for (const [oracle, stake] of Object.entries(oracles)) {
            await subscribedOracles.addOrReplace(oracle, stake);
        }
    }

    it('creation', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        const length = await subscribedOracles.length();

        expect(length).to.equal(0n);
    });

    it('add', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        expect(await subscribedOracles.length()).to.equal(BigInt(MAX_SUBSCRIBED_ORACLES));
    });

    it('sort', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        let selected = await subscribedOracles.sort(MAX_SUBSCRIBED_ORACLES);

        expect(selected.length).to.equal(MAX_SUBSCRIBED_ORACLES);

        let stake = oracles[selected[0]];
        let i = 1;

        while (i < selected.length) {
            const next = oracles[selected[i]];

            expect(stake, 'Stake should be in decreasing order').to.be.greaterThanOrEqual(next);

            stake = next;
            i += 1;
        }

        selected = await subscribedOracles.sort(MAX_SELECTED_ORACLES);

        expect(selected.length).to.equal(MAX_SELECTED_ORACLES);

        stake = oracles[selected[0]];
        i = 1;

        while (i < selected.length) {
            const next = oracles[selected[i]];

            expect(stake, 'Stake should be in decreasing order').to.be.greaterThanOrEqual(next);

            stake = next;
            i += 1;
        }
    });

    it('sort - gas', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        await subscribedOracles.sortForGas(MAX_SELECTED_ORACLES);
    });

    it('remove', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        const length = await subscribedOracles.length();
        const selected = await subscribedOracles.sort(MAX_SELECTED_ORACLES);

        for (const oracle of selected) {
            await subscribedOracles.remove(oracle);
        }

        expect(await subscribedOracles.length()).to.equal(length - BigInt(selected.length));
    });

    it('minimum', async function () {
        const subscribedOracles = await deploySubscribedOracles(5);

        for (let i = 1; i <= 5; i += 1) {
            const oracle = addressFromNumber(i);

            await subscribedOracles.addOrReplace(oracle, i);
        }

        const [minStake, minAddress] = await subscribedOracles.getMin();

        expect(minStake).to.equal(1n);
        expect(minAddress).to.equal(addressFromNumber(1));
    });

    it('on withdraw', async function () {
        const subscribedOracles = await deploySubscribedOracles();

        await addOracles(subscribedOracles);

        await subscribedOracles.selectOracles(MAX_SELECTED_ORACLES);

        const selected = await subscribedOracles.getSelectedOracles();

        for (let i = 0; i < selected.length; i += 1) {
            await subscribedOracles.onWithdraw(selected[i], i % 2 !== 0);
        }
    });
});
