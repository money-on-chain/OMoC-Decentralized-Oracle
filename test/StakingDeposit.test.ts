import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import { Deployer, type WalletClients } from 'ts-test-helpers';

describe('Staking-deposit', function () {
    const governorOwnerIndex = 1;
    const userIndex = 4;
    const amount = 2n * 10n ** 18n;

    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
        contracts = await initContracts(deployer, accounts[governorOwnerIndex]);
    });

    describe('Problem: Deposit in third party accounts is a security issue, fund in vesting-machine can be withdrawn', function () {
        it('A user should be able to deposit funds with deposit(user,destination)', async function () {
            const user = accounts[userIndex];
            await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
            await contracts.token.write.approve([contracts.staking.address, amount], {
                account: user.account!,
            });
            await contracts.staking.write.deposit([amount, user.account!.address], {
                account: user.account!,
            });
            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(
                amount,
            );
        });

        it('A user should be able to deposit funds with deposit(user)', async function () {
            const user = accounts[userIndex];
            await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
            await contracts.token.write.approve([contracts.staking.address, amount], {
                account: user.account!,
            });
            await contracts.staking.write.deposit([amount], {
                account: user.account!,
            });
            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(
                amount,
            );
        });

        it('Deposits to third parties is forbidden', async function () {
            const user = accounts[userIndex];
            await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
            await contracts.token.write.approve([contracts.staking.address, amount], {
                account: user.account!,
            });
            await viem.assertions.revertWith(
                contracts.staking.write.deposit(
                    [amount, accounts[governorOwnerIndex].account!.address],
                    {
                        account: user.account!,
                    },
                ),
                'FIX: Only sender',
            );
        });
    });

    describe('Problem: when exposed depositFrom is too risky, a user can take someones approved funds and deposit them in their own account', function () {
        it('The delay machine can call depositFrom', async function () {
            const user = accounts[userIndex];
            await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
            await contracts.token.write.approve([contracts.staking.address, amount], {
                account: user.account!,
            });
            await contracts.staking.write.deposit([amount, user.account!.address], {
                account: user.account!,
            });
            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(
                amount,
            );

            await contracts.staking.write.withdraw([amount], { account: user.account! });
            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(0n);
            expect(await contracts.token.read.balanceOf([contracts.delayMachine.address])).to.equal(
                amount,
            );

            const [ids, amounts] = await contracts.delayMachine.read.getTransactions([
                user.account!.address,
            ]);

            expect(ids.length).to.equal(1);
            expect(amounts[0]).to.equal(amount);
            await contracts.delayMachine.write.cancel([ids[0]], {
                account: user.account!,
            });
            expect(await contracts.staking.read.getBalance([user.account!.address])).to.equal(
                amount,
            );
            expect(await contracts.token.read.balanceOf([contracts.delayMachine.address])).to.equal(
                0n,
            );
        });

        it('Should fail to call depositFrom if the caller is not the delay machine', async function () {
            const user = accounts[userIndex];
            await contracts.governor.mint(contracts.token.address, user.account!.address, amount);
            await contracts.token.write.approve([contracts.staking.address, amount], {
                account: user.account!,
            });
            await viem.assertions.revertWith(
                contracts.staking.write.depositFrom(
                    [amount, user.account!.address, user.account!.address],
                    {
                        account: user.account!,
                    },
                ),
                'delayMachineOnly',
            );
        });
    });
});
