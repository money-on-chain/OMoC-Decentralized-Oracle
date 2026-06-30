import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { assertSameAddress, Deployer } from 'ts-test-helpers';

describe('CoinPairEmergencyWhitelistListChange', function () {
    it('Should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const whitelistChange = await deployer.deploy('CoinPairEmergencyWhitelistChange', [
            contracts.coinPairPriceBTCUSD.address,
            accounts[7].account!.address,
        ]);

        await contracts.governor.execute(whitelistChange);

        const whitelistListChange = await deployer.deploy('CoinPairEmergencyWhitelistListChange', [
            contracts.coinPairPriceBTCUSD.address,
        ]);

        await contracts.governor.execute(whitelistListChange);

        const whitelistLen = await whitelistListChange.read.getWhiteListLen();
        expect(whitelistLen).to.equal(1n);

        const whitelistedAtIndex = await whitelistListChange.read.getWhiteListAtIndex([0n]);
        assertSameAddress(whitelistedAtIndex, accounts[7].account!.address);
    });
});
