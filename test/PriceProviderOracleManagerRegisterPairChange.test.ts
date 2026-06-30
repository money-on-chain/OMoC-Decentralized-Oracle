import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initContractsWithCoinPairs } from './helpers.js';
import { assertSameAddress, Deployer } from 'ts-test-helpers';

describe('PriceProviderOracleManagerRegisterPairChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const priceProviderRegister = await deployer.deployUninitializedProxy('PriceProviderRegister');
        await priceProviderRegister.write.initialize([contracts.governor.address], { account: accounts[0].account! });

        const change = await deployer.deploy('PriceProviderOracleManagerRegisterPairChange', [
            priceProviderRegister.address,
            contracts.oracleMgr.address,
        ]);

        await contracts.governor.execute(change);

        assertSameAddress(
            await priceProviderRegister.read.getContractAddress([encodeCoinPair('BTCUSD')]),
            contracts.coinPairPriceBTCUSD.address,
        );
        assertSameAddress(
            await priceProviderRegister.read.getContractAddress([encodeCoinPair('RIFBTC')]),
            contracts.coinPairPriceRIFBTC.address,
        );
        expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(2n);
    });
});
