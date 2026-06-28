import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import { Deployer, registryMocOracleKey as key } from 'ts-test-helpers';

describe('MocRegistryEnteringFallbacksAmountsChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContracts(deployer, accounts[8], 3n, 10n ** 18n);

        const registry = await deployer.deployUninitializedProxy('GovernedRegistry');
        await registry.write.initialize([contracts.governor.address]);

        const change = await deployer.deploy('MocRegistryEnteringFallbacksAmountsChange', [
            registry.address,
        ]);

        await contracts.governor.execute(change);

        expect(await registry.read.getBytes([key('ORACLE_ENTERING_FALLBACKS_AMOUNTS')])).to.equal(
            '0x010204',
        );
    });
});
