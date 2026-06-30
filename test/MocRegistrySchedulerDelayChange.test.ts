import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import { Deployer, registryMocOracleKey as key } from 'ts-test-helpers';

describe('MocRegistrySchedulerDelayChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContracts(deployer, accounts[8], 3n, 10n ** 18n);

        const registry = await deployer.deployUninitializedProxy('GovernedRegistry');
        await registry.write.initialize([contracts.governor.address]);

        const change = await deployer.deploy('MocRegistrySchedulerDelayChange', [registry.address]);

        await contracts.governor.execute(change);

        expect(await registry.read.getUint([key('SCHEDULER_POOL_DELAY')])).to.equal(60n);
        expect(await registry.read.getUint([key('SCHEDULER_ROUND_DELAY')])).to.equal(1800n);
    });
});
