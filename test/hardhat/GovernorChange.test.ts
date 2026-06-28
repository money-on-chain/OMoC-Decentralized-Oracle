/*
import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { Deployer, Viem, WalletClients } from 'ts-test-helpers';

describe('GovernorChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs({
            viem,
            governorOwner: accounts[8],
            period: 3,
            minSubscriptionStake: 10n ** 18n,
        });

        const governorChange = await deployer.deploy('GovernorChange', [
            contracts.governor.address,
            contracts.coinPairPriceBTCUSD.address,
            contracts.coinPairPriceRIFBTC.address,
        ]);

        await contracts.governor.execute(governorChange);

        expect(await contracts.coinPairPriceBTCUSD.read.governor()).to.equal(contracts.governor.address);
        expect(await contracts.coinPairPriceRIFBTC.read.governor()).to.equal(contracts.governor.address);
        expect(await governorChange.read.newGovernor()).to.equal('0x0000000000000000000000000000000000000000');
    });
});
*/
