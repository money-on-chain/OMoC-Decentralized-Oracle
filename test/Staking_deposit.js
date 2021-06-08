/* global it, describe, contract, before, beforeEach */
/* eslint-disable no-unused-expressions */
const helpers = require('./helpers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { toWei, toBN } = require('web3-utils');

contract('Staking-deposit', async (accounts) => {
    const governorOwner = accounts[1];
    const amount = toWei('2', 'ether');
    const user = accounts[4];

    describe('Problem: Deposit in third party accounts is a security issue, fund in vesting-machine can be withdrawn', () => {
        beforeEach(async () => {
            const contracts = await helpers.initContracts({ governorOwner });
            Object.assign(this, contracts);
        });
        it('A user should be able to deposit funds with deposit(user,destination)', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await this.staking.deposit(amount, user, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(amount);
        });

        it('A user should be able to deposit funds with deposit(user)', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await this.staking.methods['deposit(uint256)'](amount, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(amount);
        });

        it('Deposits to third parties is forbidden', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await expectRevert(
                this.staking.deposit(amount, accounts[1], { from: user }),
                'Only sender',
            );
        });
    });

    describe('Problem: when exposed depositFrom is too risky, a user can take someones approved funds and deposit them in their own account', () => {
        before(async () => {
            const contracts = await helpers.initContracts({ governorOwner });
            Object.assign(this, contracts);
        });

        it('The delay machine can call depositFrom', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await this.staking.deposit(amount, user, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(amount);

            await this.staking.withdraw(amount, { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(toBN(0));
            expect(await this.token.balanceOf(this.delayMachine.address)).to.be.bignumber.equal(
                amount,
            );

            const delayTxs = await this.delayMachine.getTransactions(user);
            expect(delayTxs.ids.length).to.be.equal(1);
            expect(delayTxs.amounts[0]).to.be.bignumber.equal(amount);
            await this.delayMachine.cancel(delayTxs.ids[0], { from: user });
            expect(await this.staking.getBalance(user)).to.be.bignumber.equal(amount);
            expect(await this.token.balanceOf(this.delayMachine.address)).to.be.bignumber.equal(
                toBN(0),
            );
        });

        it('Should fail to call depositFrom if the caller is not the delay machine', async () => {
            await this.governor.mint(this.token.address, user, amount);
            await this.token.approve(this.staking.address, amount, { from: user });
            await expectRevert(
                this.staking.depositFrom(amount, user, user, { from: user }),
                'delayMachineOnly',
            );
        });
    });
});
