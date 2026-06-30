import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { Deployer } from 'ts-test-helpers';

describe('CoinPairPriceMaxOraclesPerRoundChange', function () {
    it('Should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const change = await deployer.deploy('CoinPairPriceMaxOraclesPerRoundChange', [
            contracts.coinPairPriceBTCUSD.address,
            10n,
        ]);

        await contracts.governor.execute(change);
    });
});
