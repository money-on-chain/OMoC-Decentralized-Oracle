import { expect } from 'chai';
import { network } from 'hardhat';
import { Deployer } from 'ts-test-helpers';

import { addressFromNumber } from '../src/helpers.js';

describe('SubscribedOracles', function () {
    let deployer: Deployer;

    beforeEach(async function () {
        const { viem } = await network.create();
        deployer = await Deployer.default(viem);
    });

    async function deploySubscribedOracles() {
        const subscribedOracles = await deployer.deploy('SubscribedOraclesMock', []);
        expect(subscribedOracles).to.not.be.undefined;
        return subscribedOracles;
    }

    it('creation', async function () {
        const subscribedOracles = await deploySubscribedOracles();
        expect(await subscribedOracles.read.length()).to.equal(0n);
    });

    it('add and contains', async function () {
        const subscribedOracles = await deploySubscribedOracles();
        const addresses = Array.from({ length: 10 }, (_, i) => addressFromNumber(i + 1));

        for (const addr of addresses) {
            await subscribedOracles.write.add([addr]);
            expect(await subscribedOracles.read.contains([addr])).to.equal(true);
        }

        expect(await subscribedOracles.read.length()).to.equal(10n);
    });

    it('remove', async function () {
        const subscribedOracles = await deploySubscribedOracles();
        const addresses = Array.from({ length: 10 }, (_, i) => addressFromNumber(i + 1));

        for (const addr of addresses) {
            await subscribedOracles.write.add([addr]);
        }

        for (let i = 0; i < 4; i += 1) {
            const addr = await subscribedOracles.read.at([0n]);
            await subscribedOracles.write.remove([addr]);
            expect(await subscribedOracles.read.contains([addr])).to.equal(false);
        }

        expect(await subscribedOracles.read.length()).to.equal(6n);
    });
});
