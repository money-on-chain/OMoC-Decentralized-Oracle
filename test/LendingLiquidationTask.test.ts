import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeAbiParameters } from 'viem';
import { Deployer } from 'ts-test-helpers';

describe('LendingLiquidationTask', function () {
    it('checks and executes a liquidation with the immutable market', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const manager = await deployer.deploy('MockLendingManagerForTask');
        const tpToken = accounts[10].account!.address;
        const mocBucket = accounts[11].account!.address;
        const user = accounts[12].account!.address;
        const task = await deployer.deploy('LendingLiquidationTask', [
            manager.address,
            tpToken,
            mocBucket,
        ]);
        const payload = encodeAbiParameters([{ type: 'address' }], [user]);

        expect(await task.read.checkTask([payload])).to.equal(false);
        await manager.write.setLiquidationAvailable([true]);
        expect(await task.read.checkTask([payload])).to.equal(true);
        await task.write.runTask([payload]);

        expect(await manager.read.liquidationCount()).to.equal(1n);
        expect((await manager.read.lastUser()).toLowerCase()).to.equal(user.toLowerCase());
        expect((await manager.read.lastTpToken()).toLowerCase()).to.equal(tpToken.toLowerCase());
        expect((await manager.read.lastMocBucket()).toLowerCase()).to.equal(
            mocBucket.toLowerCase(),
        );
    });

    it('rejects non-canonical payload lengths', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const manager = await deployer.deploy('MockLendingManagerForTask');
        const task = await deployer.deploy('LendingLiquidationTask', [
            manager.address,
            accounts[10].account!.address,
            accounts[11].account!.address,
        ]);

        await viem.assertions.revertWithCustomError(
            task.read.checkTask(['0x1234']),
            task,
            'InvalidPayloadLength',
        );
    });
});
