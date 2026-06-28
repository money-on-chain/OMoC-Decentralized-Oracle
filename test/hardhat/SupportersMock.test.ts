import { expect } from 'chai';
import assert from 'node:assert/strict';
import { parseEther } from 'viem';
import { network } from 'hardhat';
import { createGovernor, waitForEvents } from './helpers.js';
import type { Account } from 'viem';
import {
    Deployer,
    assertSameAddress,
    ContractOf,
    Viem,
    WalletClients,
    NetworkHelpers,
} from 'ts-test-helpers';

describe('SupportersMock', function () {
    let deployer: Deployer;
    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let accounts: WalletClients;

    let supporters: ContractOf<'SupportersMock'>;
    let token: ContractOf<'GovernedERC20'>;
    let governor: any;
    let user1: Account;
    let user2: Account;
    let user3: Account;
    let payer: Account;

    const BALANCE_USER1 = parseEther('1');
    const BALANCE_USER2 = parseEther('1');
    const BALANCE_USER3 = parseEther('1');
    const BALANCE_PAYER = parseEther('10');

    async function deployFixture() {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);

        accounts = await viem.getWalletClients();
        user1 = accounts[2].account!;
        user2 = accounts[3].account!;
        user3 = accounts[4].account!;
        payer = accounts[9].account!;

        governor = await createGovernor(deployer, accounts[8]);

        token = await deployer.deploy('GovernedERC20');
        await token.write.initialize([governor.address]);
        supporters = await deployer.deployProxy('SupportersMock', [token.address, 10n]);
    }

    async function mint(address: string, amount: bigint) {
        await governor.mint(token.address, address, amount);
    }

    describe('Creation', function () {
        beforeEach(async function () {
            await deployFixture();
        });

        it('check creation', async function () {
            expect(supporters).to.not.equal(undefined);
            const mocToken = await supporters.read.mocToken();
            assertSameAddress(token.address, mocToken);
        });

        it('check initialization', async function () {
            const mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            const tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);
        });
    });

    describe('Deposits', function () {
        const INITIAL_BALANCE = BALANCE_USER1;
        const EARNINGS = parseEther('1');
        const FINAL_BALANCE = INITIAL_BALANCE + EARNINGS;

        beforeEach(async function () {
            await deployFixture();

            await mint(user1.address, BALANCE_USER1);
            await mint(payer.address, BALANCE_PAYER);

            await token.write.approve([supporters.address, BALANCE_USER1], {
                account: user1,
            });
        });

        it('check minted tokens & approvals', async function () {
            const balance1 = await token.read.balanceOf([user1.address]);
            expect(balance1).to.equal(BALANCE_USER1);

            const allowance1 = await token.read.allowance([user1.address, supporters.address]);
            expect(allowance1).to.equal(BALANCE_USER1);
        });

        it('deposit earnings', async function () {
            let tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);

            let mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });

            await viem.assertions.revertWith(
                supporters.write.distribute({ account: payer }),
                'Not ready to distribute',
            );

            tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);

            mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            mocs = await token.read.balanceOf([supporters.address]);
            expect(mocs).to.equal(EARNINGS);
        });

        it('distribute after stake', async function () {
            let tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);

            let mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });

            await viem.assertions.revertWith(
                supporters.write.distribute({ account: payer }),
                'Not ready to distribute',
            );

            await supporters.write.stake([BALANCE_USER1], { account: user1 });

            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(BALANCE_USER1);

            mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(FINAL_BALANCE);
        });
    });

    describe('Staking', function () {
        const INITIAL_BALANCE = BALANCE_USER1;
        const EARNINGS = parseEther('1');
        const FINAL_BALANCE = INITIAL_BALANCE + EARNINGS;

        beforeEach(async function () {
            await deployFixture();

            await mint(user1.address, BALANCE_USER1);
            await mint(payer.address, BALANCE_PAYER);

            await token.write.approve([supporters.address, BALANCE_USER1 * 2n], {
                account: user1,
            });

            await supporters.write.stake([BALANCE_USER1], { account: user1.address });
        });

        it('stake and withdraw', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(0n);

            await supporters.write.withdraw([BALANCE_USER1], { account: user1.address });

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(0n);

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);
        });

        it('stake and partial withdraw', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(0n);

            const withdrawTokens = tokens / 3n;
            const remainingTokens = tokens - withdrawTokens;

            await supporters.write.withdraw([withdrawTokens], { account: user1 });

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(remainingTokens);

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(withdrawTokens);
        });

        it('distribute earnings', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(INITIAL_BALANCE);

            let mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(INITIAL_BALANCE);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });

            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(INITIAL_BALANCE);

            mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(FINAL_BALANCE);
        });

        it('withdraw', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });

            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            const EXPECTED_BALANCE = (FINAL_BALANCE * BALANCE_USER1) / INITIAL_BALANCE;

            mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(EXPECTED_BALANCE);

            await supporters.write.withdraw([BALANCE_USER1], { account: user1 });

            const balance = await token.read.balanceOf([user1.address]);
            expect(balance).to.equal(EXPECTED_BALANCE);

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(0n);
        });

        it('staking after early withdraw', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });

            mocs = await token.read.balanceOf([supporters.address]);
            expect(mocs).to.equal(FINAL_BALANCE);

            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            const tx = await supporters.write.withdraw([BALANCE_USER1], { account: user1 });

            const event = (await waitForEvents(viem, supporters, 'WithdrawStake', tx))[0];

            const withdrawn = event.args.mocs;
            const remaining = FINAL_BALANCE - withdrawn;

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(withdrawn);

            mocs = await token.read.balanceOf([supporters.address]);
            expect(mocs).to.equal(remaining);

            tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);

            mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            await supporters.write.stake([BALANCE_USER1], { account: user1 });

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);
        });
    });

    describe('Multiple stakes', function () {
        const INITIAL_BALANCE = BALANCE_USER1 + BALANCE_USER2 + BALANCE_USER3;
        const EARNINGS = parseEther('1');
        const FINAL_BALANCE = INITIAL_BALANCE + EARNINGS;

        beforeEach(async function () {
            await deployFixture();

            await mint(user1.address, BALANCE_USER1);
            await mint(user2.address, BALANCE_USER2);
            await mint(user3.address, BALANCE_USER3);
            await mint(payer.address, BALANCE_PAYER);

            await token.write.approve([supporters.address, BALANCE_USER1], {
                account: user1,
            });
            await token.write.approve([supporters.address, BALANCE_USER2], {
                account: user2,
            });
            await token.write.approve([supporters.address, BALANCE_USER3], {
                account: user3,
            });
            await token.write.approve([supporters.address, BALANCE_PAYER], {
                account: payer,
            });

            await supporters.write.stake([BALANCE_USER1], { account: user1 });
            await supporters.write.stake([BALANCE_USER2], { account: user2 });
            await supporters.write.stake([BALANCE_USER3], { account: user3 });
        });

        it('single withdrawal', async function () {
            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);

            await token.write.transfer([supporters.address, EARNINGS], { account: payer });
            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            const expectedBalanceUser1 = (FINAL_BALANCE * BALANCE_USER1) / INITIAL_BALANCE;

            mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(expectedBalanceUser1);

            await supporters.write.withdraw([BALANCE_USER1], { account: user1 });

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(expectedBalanceUser1);

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(0n);

            mocs = await supporters.read.getMOCBalance([user1.address]);
            expect(mocs).to.equal(0n);
        });

        it('multiple withdrawals', async function () {
            await token.write.transfer([supporters.address, EARNINGS], { account: payer });
            await supporters.write.distribute({ account: payer });

            await networkHelpers.mine(10);

            const users = [user1, user2, user3];

            for (const user of users) {
                let tokens = await supporters.read.getBalance([user.address]);

                const tokenSupporters = await supporters.read.getTokens();
                const mocsSupporters = await supporters.read.getAvailableMOC();
                const expectedBalance = (tokens * mocsSupporters) / tokenSupporters;

                const mocs = await supporters.read.getMOCBalance([user.address]);
                expect(mocs).to.equal(expectedBalance);

                await supporters.write.withdraw([tokens], { account: user });

                tokens = await token.read.balanceOf([user.address]);
                expect(tokens).to.equal(expectedBalance);
            }

            const expectedBalance = FINAL_BALANCE / 3n;

            let mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(expectedBalance);

            const roundingError = FINAL_BALANCE % 3n;

            mocs = await token.read.balanceOf([user3.address]);
            expect(mocs).to.equal(expectedBalance + roundingError);

            const tokens = await supporters.read.getTokens();
            expect(tokens).to.equal(0n);

            mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);
        });

        it('multiple earlier withdrawals', async function () {
            await token.write.transfer([supporters.address, EARNINGS], { account: payer });
            await supporters.write.distribute({ account: payer });

            const users = [user1, user2, user3];

            let withdrawn = 0n;

            for (const user of users) {
                const tokens = await supporters.read.getBalance([user.address]);

                const tx = await supporters.write.withdraw([tokens], { account: user });
                const event = (await waitForEvents(viem, supporters, 'WithdrawStake', tx))[0];

                withdrawn += event.args.mocs;
            }

            let mocs = await supporters.read.getAvailableMOC();
            expect(mocs).to.equal(0n);

            mocs = await token.read.balanceOf([supporters.address]);
            expect(mocs).to.equal(FINAL_BALANCE - withdrawn);
        });
    });

    describe('Subaccounts', function () {
        const INITIAL_BALANCE = BALANCE_USER1 + BALANCE_USER1;

        beforeEach(async function () {
            await deployFixture();

            await mint(user1.address, INITIAL_BALANCE);
            await mint(user2.address, BALANCE_USER2);
            await mint(user3.address, BALANCE_USER3);
            await mint(payer.address, BALANCE_PAYER);

            await token.write.approve([supporters.address, INITIAL_BALANCE], {
                account: user1,
            });
        });

        it('stake', async function () {
            await supporters.write.stake([BALANCE_USER1], { account: user1 });

            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);

            await supporters.write.stakeAt([BALANCE_USER1, user3.address], {
                account: user1,
            });

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            tokens = await supporters.read.getBalance([user3.address]);
            expect(tokens).to.equal(0n);

            tokens = await supporters.read.getBalanceAt([user1.address, user3.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            tokens = await supporters.read.getBalanceAt([user3.address, user1.address]);
            expect(tokens).to.equal(0n);

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(0n);
        });

        it('withdraw', async function () {
            await supporters.write.stake([BALANCE_USER1], { account: user1 });

            let tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            let mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(BALANCE_USER1);

            await supporters.write.stakeAt([BALANCE_USER1, user3.address], {
                account: user1,
            });

            await supporters.write.withdraw([BALANCE_USER1], { account: user1 });

            tokens = await supporters.read.getBalance([user1.address]);
            expect(tokens).to.equal(0n);

            tokens = await supporters.read.getBalanceAt([user1.address, user3.address]);
            expect(tokens).to.equal(BALANCE_USER1);

            await supporters.write.withdrawFrom([BALANCE_USER1, user3.address], {
                account: user1,
            });

            tokens = await supporters.read.getBalanceAt([user1.address, user3.address]);
            expect(tokens).to.equal(0n);

            mocs = await token.read.balanceOf([user1.address]);
            expect(mocs).to.equal(INITIAL_BALANCE);
        });
    });

    describe('Stake HUGE amount', function () {
        const USER1_BALANCE = 2n ** 129n;
        const USER2_BALANCE = 2n ** 129n;
        const USER3_BALANCE = 2n ** 126n;
        const PAYER_BALANCE = 2n ** 129n - 1n;

        beforeEach(async function () {
            await deployFixture();

            await mint(user1.address, USER1_BALANCE);
            await mint(user2.address, USER2_BALANCE);
            await mint(user3.address, USER3_BALANCE);
            await mint(payer.address, PAYER_BALANCE);
        });

        it('handles the legacy overflow boundary scenario', async function () {
            await token.write.approve([supporters.address, USER1_BALANCE], {
                account: user1,
            });
            await supporters.write.stake([USER1_BALANCE], { account: user1 });

            await assert.rejects(
                supporters.read.getMOCBalance([user1.address]),
                /SafeMath: multiplication overflow/,
            );

            await token.write.approve([supporters.address, USER2_BALANCE], {
                account: user2,
            });

            for (let i = 0; i < 8; i += 1) {
                await supporters.write.stake([USER2_BALANCE / 8n], { account: user2 });
            }

            expect(await supporters.read.getBalance([user2.address])).to.equal(USER2_BALANCE);
            await assert.rejects(
                supporters.read.getMOCBalance([user2.address]),
                /SafeMath: multiplication overflow/,
            );

            await token.write.approve([supporters.address, USER3_BALANCE], {
                account: user3,
            });
            await viem.assertions.revertWith(
                supporters.write.stake([USER3_BALANCE], { account: user3 }),
                'SafeMath: multiplication overflow',
            );

            expect(await supporters.read.getBalance([user3.address])).to.equal(0n);

            await token.write.transfer([supporters.address, PAYER_BALANCE], {
                account: payer,
            });

            const contractBalance = await token.read.balanceOf([supporters.address]);
            expect(contractBalance).to.equal(USER1_BALANCE + USER2_BALANCE + PAYER_BALANCE);
        });
    });
});
