import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { Deployer, assertSameAddress } from 'ts-test-helpers';

describe('GovernorChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8]);

        const governorChange = await deployer.deploy('GovernorChange', [
            contracts.governor.address,
            [contracts.coinPairPriceBTCUSD.address, contracts.coinPairPriceRIFBTC.address],
        ]);

        await contracts.governor.execute(governorChange);

        assertSameAddress(
            await contracts.coinPairPriceBTCUSD.read.governor(),
            contracts.governor.address,
        );
        assertSameAddress(
            await contracts.coinPairPriceRIFBTC.read.governor(),
            contracts.governor.address,
        );
        expect(await governorChange.read.newGovernor()).to.equal(
            '0x0000000000000000000000000000000000000000',
        );
    });
});
