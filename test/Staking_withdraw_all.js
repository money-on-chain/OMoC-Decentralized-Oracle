/* global it, describe, contract, before */
/* eslint-disable no-unused-expressions */
const helpers = require('./helpers');
const { expect } = require('chai');
const { toWei, toBN } = require('web3-utils');

contract('Staking-withdraw-all', async (accounts) => {
    const governorOwner = accounts[1];
    const amount = toBN(toWei('2', 'ether'));
    const user = accounts[4];

    const prepare = () => {
        it('deploy contracts', async () => {
            const contracts = await helpers.initContracts({ governorOwner });
            Object.assign(this, contracts);
        });

        it('initial stake', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await this.staking.deposit(amount, user, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(amount);
        });

        it('mint and distribute some rewards', async () => {
            await this.governor.mint(
                this.token.address,
                this.supporters.address,
                toBN(toWei('100', 'ether')),
            );
            await this.supporters.distribute();
            await helpers.mineBlocks(10);
            expect(await this.staking.getBalance(user)).to.be.bignumber.gt(amount);
        });
    };

    describe.skip('Problem description: When a user remove the stake by calling withdraw in mocs and the blockchain keeps minning rewards there is no way to withdraw all', () => {
        prepare();

        it('withdraw', async () => {
            const currentBalance = await this.staking.getBalance(user);
            await helpers.mineBlocks(10);
            // In this point we end up withdrawing the wrong sum
            await this.staking.withdraw(currentBalance, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.gt(toBN(0));
        });
    });

    describe('Solution: do the withdraw in tokens -> withdrawAll', () => {
        prepare();

        it('withdrawAll', async () => {
            await helpers.mineBlocks(10);
            await this.staking.withdrawAll({ from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(toBN(0));
        });
    });
});
