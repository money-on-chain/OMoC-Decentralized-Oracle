import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import { Deployer, type NetworkHelpers, type WalletClients } from 'ts-test-helpers';

describe('Staking-withdraw-all', function () {
    const governorOwnerIndex = 1;
    const userIndex = 4;
    const amount = 2n * 10n ** 18n;
    const rewardsAmount = 100n * 10n ** 18n;

    let networkHelpers: NetworkHelpers;
    let deployer: Deployer;
    let accounts: WalletClients;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let contracts: Awaited<ReturnType<typeof initContracts>>;

    beforeEach(async function () {
        ({ networkHelpers, viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
        contracts = await initContracts(deployer, accounts[governorOwnerIndex]);
    });

    async function prepareRewardedStake() {
        const user = accounts[userIndex];

        await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
        await contracts.token.write.approve([contracts.staking.address, amount], {
            account: user.account!,
        });
        await contracts.staking.write.deposit([amount, user.account!.address], {
            account: user.account!,
        });
        expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(amount);

        await contracts.governor.mint(contracts.token.address, contracts.supporters.address, rewardsAmount);
        await contracts.supporters.write.distribute({ account: accounts[0].account! });
        await networkHelpers.mine(10);

        expect(await contracts.staking.read.getBalance([user.account!.address])).to.be.greaterThan(
            amount,
        );

        return user;
    }

    describe('Solution: do the withdraw in tokens -> withdrawAll', function () {
        it('withdrawAll', async function () {
            const user = await prepareRewardedStake();

            await networkHelpers.mine(10);
            await contracts.staking.write.withdrawAll({ account: user.account! });

            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(0n);
        });
    });
});
