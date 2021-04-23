/* global artifacts, it, describe, contract, beforeEach */
/* eslint-disable no-unused-expressions */
const {expect} = require('chai');
const {BN, expectRevert, expectEvent, time} = require('@openzeppelin/test-helpers');
const DelayMachine = artifacts.require('DelayMachine');
const MOCKStakingMachine = artifacts.require('MOCKStakingMachine');
const GovernedERC20 = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedERC20');
const MockGovernor = artifacts.require('@money-on-chain/omoc-sc-shared/MockGovernor');

contract('DelayMachine', (accounts) => {
    const [GOVERNOR_OWNER, DESTIONATION_MOC_HOLDER, SOURCE_MOC_HOLDER, DUMMY_ACCOUNT] = accounts;
    const INITIAL_BALANCE = new BN('100000000000000000000');

    async function notExpired(expiration, currentTime, expirationDelta) {
        return expiration.gt(currentTime) && expiration.lte(expirationDelta.add(currentTime));
    }

    async function createContracts(source) {
        const governor = await MockGovernor.new(GOVERNOR_OWNER);
        const erc20 = await GovernedERC20.new();
        await erc20.initialize(governor.address);
        const delay = await DelayMachine.new();
        await delay.initialize(governor.address, erc20.address, source);
        await erc20.mint(SOURCE_MOC_HOLDER, INITIAL_BALANCE, {from: GOVERNOR_OWNER});
        return {erc20, delay};
    }

    async function depositViaStaking(contract, token, stacking, amount, expirationSecs) {
        // Deposit in the staking machine.
        await token.approve(stacking.address, amount, {from: SOURCE_MOC_HOLDER});
        await stacking.depositFrom(amount, DESTIONATION_MOC_HOLDER, SOURCE_MOC_HOLDER, {
            from: SOURCE_MOC_HOLDER,
        });
        expect(await token.balanceOf(stacking.address)).to.be.bignumber.equal(amount);

        // Withdraw from staking => deposit in delay
        const prevBalance = await token.balanceOf(contract.address);
        const receipt = await stacking.withdraw(amount, expirationSecs);
        expect(await token.balanceOf(stacking.address)).to.be.bignumber.equal(new BN(0));
        expect(await token.balanceOf(contract.address)).to.be.bignumber.equal(
            prevBalance.add(amount),
        );
        expectEvent(receipt, 'PaymentDeposit', {destination: DESTIONATION_MOC_HOLDER});
        return receipt.logs[0].args[0];
    }

    async function multipleDeposit(contract, token, cant, stacking) {
        let totalBalance = new BN(0);
        const inserted = [];
        for (let i = 0; i < cant; i++) {
            const expirationDelta = new BN(10 + Math.random() * 1000000);
            const amount = new BN(Math.random() * 10000);
            const currentTime = await time.latest();
            inserted.push({id: new BN(i + 1), amount, expirationDelta, currentTime});
            await depositViaStaking(contract, token, stacking, amount, expirationDelta);
            totalBalance = totalBalance.add(amount);
            expect(await contract.getBalance(DESTIONATION_MOC_HOLDER)).to.be.bignumber.equal(
                totalBalance,
            );
        }
        const data = await contract.getTransactions(DESTIONATION_MOC_HOLDER);
        const txs = data.ids.map((id, i) => ({
            id,
            iid: inserted[i].id,
            amount: data.amounts[i],
            iamount: inserted[i].amount,
            expiration: data.expirations[i],
            expirationDelta: inserted[i].expirationDelta,
            insertTime: inserted[i].currentTime,
        }));
        txs.sort((a, b) => a.expiration.cmp(b.expiration));
        txs.forEach((x, i) => {
            expect(x.id).to.be.bignumber.equal(x.iid);
            expect(x.amount).to.be.bignumber.equal(x.iamount);
            notExpired(x.expiration, x.insertTime, x.expirationDelta);
        });
        return txs;
    }

    describe('direct operation', () => {
        let contract;
        let token;
        beforeEach(async () => {
            const {erc20, delay} = await createContracts(SOURCE_MOC_HOLDER);
            contract = delay;
            token = erc20;
        });

        it('creation', async () => {
            expect(await token.balanceOf(SOURCE_MOC_HOLDER)).to.be.bignumber.equal(INITIAL_BALANCE);
            await token.approve(contract.address, 123, {from: SOURCE_MOC_HOLDER});
            expect(
                await token.allowance(SOURCE_MOC_HOLDER, contract.address),
            ).to.be.bignumber.equal(new BN(123));
        });

        it('deposit fail', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            await expectRevert(
                contract.deposit(amount, DESTIONATION_MOC_HOLDER, expirationSecs, {
                    from: DUMMY_ACCOUNT,
                }),
                'Wrong source',
            );
        });

        it('deposit', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);

            await token.approve(contract.address, amount, {from: SOURCE_MOC_HOLDER});
            const receipt = await contract.deposit(
                amount,
                DESTIONATION_MOC_HOLDER,
                expirationSecs,
                {from: SOURCE_MOC_HOLDER},
            );

            expect(await contract.getBalance(DESTIONATION_MOC_HOLDER)).to.be.bignumber.equal(
                amount,
            );
            const txs = await contract.getTransactions(DESTIONATION_MOC_HOLDER);
            expect(txs.amounts).to.satisfy((a) => a[0].eq(amount));
            const currentTime = await time.latest();
            expect(txs.expirations).to.satisfy((a) =>
                notExpired(a[0], currentTime, expirationSecs),
            );
            expectEvent(receipt, 'PaymentDeposit', {
                source: SOURCE_MOC_HOLDER,
                destination: DESTIONATION_MOC_HOLDER,
                amount: amount,
                expiration: expirationSecs,
            });
        });

        it('withdraw fail', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);

            await token.approve(contract.address, amount, {from: SOURCE_MOC_HOLDER});
            const receipt = await contract.deposit(
                amount,
                DESTIONATION_MOC_HOLDER,
                expirationSecs,
                {from: SOURCE_MOC_HOLDER},
            );
            const payId = receipt.logs[0].args[0];

            await expectRevert(contract.withdraw(payId, {from: SOURCE_MOC_HOLDER}), 'Invalid ID');
            await expectRevert(
                contract.withdraw(payId, {from: DESTIONATION_MOC_HOLDER}),
                'Not expired',
            );
        });

        it('withdraw success', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);

            await token.approve(contract.address, amount, {from: SOURCE_MOC_HOLDER});
            const receipt = await contract.deposit(
                amount,
                DESTIONATION_MOC_HOLDER,
                expirationSecs,
                {from: SOURCE_MOC_HOLDER},
            );
            const payId = receipt.logs[0].args[0];

            const startBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
            await time.increase(expirationSecs.addn(1));
            const receipt2 = await contract.withdraw(payId, {from: DESTIONATION_MOC_HOLDER});
            expectEvent(receipt2, 'PaymentWithdraw', {
                destination: DESTIONATION_MOC_HOLDER,
                source: SOURCE_MOC_HOLDER,
                amount: amount,
            });
            const endBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
            expect(endBalance.sub(startBalance)).to.be.bignumber.equal(amount);
        });
    });

    describe('stacking machine mock operation', () => {
        let contract;
        let token;
        let stacking;

        beforeEach(async () => {
            stacking = await MOCKStakingMachine.new();
            const {erc20, delay} = await createContracts(stacking.address);
            contract = delay;
            token = erc20;
            await stacking.initialize(contract.address, token.address);
        });

        it('deposit', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            await depositViaStaking(contract, token, stacking, amount, expirationSecs);
            expect(await contract.getBalance(DESTIONATION_MOC_HOLDER)).to.be.bignumber.equal(
                amount,
            );
        });

        it('withdraw fail', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            const payId = await depositViaStaking(
                contract,
                token,
                stacking,
                amount,
                expirationSecs,
            );
            await expectRevert(contract.withdraw(payId, {from: SOURCE_MOC_HOLDER}), 'Invalid ID');
            await expectRevert(
                contract.withdraw(payId, {from: DESTIONATION_MOC_HOLDER}),
                'Not expired',
            );
        });

        it('withdraw success', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            const payId = await depositViaStaking(
                contract,
                token,
                stacking,
                amount,
                expirationSecs,
            );
            const startBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
            await time.increase(expirationSecs + 1);
            const receipt2 = await contract.withdraw(payId, {from: DESTIONATION_MOC_HOLDER});
            expectEvent(receipt2, 'PaymentWithdraw', {
                destination: DESTIONATION_MOC_HOLDER,
                source: stacking.address,
                amount: amount,
            });
            const endBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
            expect(endBalance.sub(startBalance)).to.be.bignumber.equal(amount);
        });

        it('cancel fail', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            const payId = await depositViaStaking(
                contract,
                token,
                stacking,
                amount,
                expirationSecs,
            );
            await expectRevert(contract.cancel(payId, {from: SOURCE_MOC_HOLDER}), 'Invalid ID');
        });

        it('cancel success', async () => {
            const expirationSecs = new BN(Math.random() * 10000);
            const amount = new BN(Math.random() * 10000);
            const payId = await depositViaStaking(
                contract,
                token,
                stacking,
                amount,
                expirationSecs,
            );

            expect(await stacking.source()).to.be.equal(SOURCE_MOC_HOLDER);
            const startBalance = await token.balanceOf(stacking.address);
            const receipt2 = await contract.cancel(payId, {from: DESTIONATION_MOC_HOLDER});
            expectEvent(receipt2, 'PaymentCancel', {
                destination: DESTIONATION_MOC_HOLDER,
                source: stacking.address,
                amount: amount,
            });
            expect(await stacking.destination()).to.be.equal(DESTIONATION_MOC_HOLDER);
            expect(await stacking.source()).to.be.equal(contract.address);
            const endBalance = await token.balanceOf(stacking.address);
            expect(endBalance.sub(startBalance)).to.be.bignumber.equal(amount);
        });
    });

    describe('multiple deposits [slow] [skip-on-coverage]', () => {
        const CANT = 20;
        let stacking;
        let contract;
        let token;
        beforeEach(async () => {
            stacking = await MOCKStakingMachine.new();
            const {erc20, delay} = await createContracts(stacking.address);
            contract = delay;
            token = erc20;
            await stacking.initialize(contract.address, token.address);
        });

        it('withdraw', async () => {
            const sorted = await multipleDeposit(contract, token, CANT, stacking);
            // console.log(sorted.map(x => x.expiration.sub(sorted[0].expiration).toString()));
            for (let i = 0; i < sorted.length; i++) {
                // this can fail if the difference between two expiration si too small (unlikely)
                await time.increaseTo(sorted[i].expiration.addn(1));
                // sorted[i] must success to withdraw, the rest must fail.
                for (let j = 0; j < sorted.length; j++) {
                    if (j < i) {
                        // Already withdrawn
                        await expectRevert(
                            contract.withdraw(sorted[j].id, {from: DESTIONATION_MOC_HOLDER}),
                            'Invalid ID',
                        );
                    } else if (j === i) {
                        // success
                        const startBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
                        const receipt2 = await contract.withdraw(sorted[j].id, {
                            from: DESTIONATION_MOC_HOLDER,
                        });
                        expectEvent(receipt2, 'PaymentWithdraw', {
                            destination: DESTIONATION_MOC_HOLDER,
                            source: stacking.address,
                            amount: sorted[j].amount,
                        });
                        const endBalance = await token.balanceOf(DESTIONATION_MOC_HOLDER);
                        expect(endBalance.sub(startBalance)).to.be.bignumber.equal(
                            sorted[j].amount,
                        );
                    } else if (j > i) {
                        // fail, still need time
                        await expectRevert(
                            contract.withdraw(sorted[j].id, {from: DESTIONATION_MOC_HOLDER}),
                            'Not expired',
                        );
                    }
                }
            }
        });
    });
});
