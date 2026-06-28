import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { assertSameAddress, Deployer, registryMocOracleKey as key } from 'ts-test-helpers';

describe('MocRegistryInitChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const infoGetter = await deployer.deployProxy('InfoGetter', [contracts.governor.address]);
        const registry = await deployer.deployProxy('GovernedRegistry', [
            contracts.governor.address,
        ]);

        const change = await deployer.deploy('MocRegistryInitChange', [
            registry.address,
            contracts.delayMachine.address,
            contracts.oracleMgr.address,
            contracts.supporters.address,
            infoGetter.address,
        ]);

        await contracts.governor.execute(change);

        assertSameAddress(
            await registry.read.getAddress([key('ORACLE_MANAGER_ADDR')]),
            contracts.oracleMgr.address,
        );
    });
});
