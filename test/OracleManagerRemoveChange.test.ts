import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { Deployer } from 'ts-test-helpers';

describe('OracleManagerRemoveChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const oracleOwner = accounts[7];
        const oracleAddr = accounts[6].account!.address;
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, 10n ** 18n);

        const change = await deployer.deploy('OracleManagerRemoveChange', [
            contracts.oracleMgr.address,
            oracleOwner.account!.address,
        ]);

        await contracts.staking.write.registerOracle([oracleAddr, 'url'], {
            account: oracleOwner.account!,
        });
        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracleOwner.account!.address]),
        ).to.equal(true);

        await contracts.governor.execute(change);

        expect(
            await contracts.oracleMgr.read.isOracleRegistered([oracleOwner.account!.address]),
        ).to.equal(false);
    });
});
