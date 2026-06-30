import { network } from 'hardhat';
import { encodeCoinPair, initContractsWithCoinPairs } from './helpers.js';
import { assertSameAddress, Deployer } from 'ts-test-helpers';

describe('OracleManagerPairChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contractAddr = accounts[7].account!.address;
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const change = await deployer.deploy('OracleManagerPairChange', [
            contracts.oracleMgr.address,
            encodeCoinPair('RIFUSD'),
            contractAddr,
        ]);

        await contracts.governor.execute(change);

        assertSameAddress(
            contractAddr,
            await contracts.oracleMgr.read.getContractAddress([encodeCoinPair('RIFUSD')]),
        );
    });
});
