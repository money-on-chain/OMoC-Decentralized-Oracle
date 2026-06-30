import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { Deployer } from 'ts-test-helpers';

describe('SupportersPeriodChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const initialPeriod = 3n;
        const updatedPeriod = 9n;
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], initialPeriod, 10n ** 18n);

        expect(await contracts.supporters.read.period()).to.equal(initialPeriod);

        const change = await deployer.deploy('SupportersPeriodChange', [
            contracts.supporters.address,
            updatedPeriod,
        ]);

        await contracts.governor.execute(change);

        expect(await contracts.supporters.read.period()).to.equal(updatedPeriod);
    });
});
