import { expect } from 'chai';
import { network } from 'hardhat';
import { initContractsWithCoinPairs } from './helpers.js';
import { ContractOf, Deployer } from 'ts-test-helpers';

describe('TestMOCMintChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const user = accounts[7];
        const amount = 10n ** 18n;
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, amount);

        const change = await deployer.deploy('TestMOCMintChange', [
            contracts.token.address,
            user.account!.address,
            amount,
        ]);

        const token: ContractOf<'GovernedERC20'> = contracts.token;
        const balanceBefore = await token.read.balanceOf([user.account!.address]);
        await contracts.governor.execute(change);
        const balanceAfter = await token.read.balanceOf([user.account!.address]);

        expect(balanceAfter - balanceBefore).to.equal(amount);
    });
});
