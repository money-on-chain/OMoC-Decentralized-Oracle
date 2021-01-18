/* global describe,it, beforeEach */
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const helpers = require('./helpers');

const SupportersMock = artifacts.require('SupportersMock');
const TestMOC = artifacts.require('@moc/shared/GovernedERC20');

contract('SupportersMock', (accounts) => {
    let supporters;
    let token;

    const BALANCE_USER1 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_USER2 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_USER3 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_PAYER = new BN(web3.utils.toWei('10', 'ether'));

    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const payer = accounts[9];

    describe('Creation', () => {
        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));
        });

        it('check creation', async () => {
            assert.ok(supporters);
            const mocToken = await supporters.mocToken();
            assert.equal(mocToken, token.address, 'MOC token address');
        });

        it('check initialization', async () => {
            const mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Available MOC').to.be.bignumber.equal(new BN(0));

            const tokens = await supporters.getTokens();
            expect(tokens, 'Available tokens').to.be.bignumber.equal(new BN(0));
        });
    });

    describe('Deposits', () => {
        const INITIAL_BALANCE = BALANCE_USER1;
        const EARNINGS = new BN(web3.utils.toWei('1', 'ether'));
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS);

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);

            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));

            await governor.mint(token.address, user1, BALANCE_USER1);
            await governor.mint(token.address, payer, BALANCE_PAYER);

            await token.approve(supporters.address, BALANCE_USER1, { from: user1 });
        });

        it('check minted tokens & approvals', async () => {
            const balance1 = await token.balanceOf(user1);
            expect(balance1, 'Balance user1').to.be.bignumber.equal(BALANCE_USER1);

            const allowance1 = await token.allowance(user1, supporters.address);
            expect(allowance1, 'Allowance user1').to.be.bignumber.equal(BALANCE_USER1);
        });

        it('deposit earnings', async () => {
            let tokens = await supporters.getTokens();
            expect(tokens, 'Initial token balance').to.be.bignumber.equal(new BN(0));

            let mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(new BN(0));

            await token.transfer(supporters.address, EARNINGS, { from: payer });

            await expectRevert(supporters.distribute({ from: payer }), 'Not ready to distribute');

            tokens = await supporters.getTokens();
            expect(tokens, 'Final token balance').to.be.bignumber.equal(new BN(0));

            mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(supporters.address);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(EARNINGS);
        });

        it('distribute after stake', async () => {
            let tokens = await supporters.getTokens();
            expect(tokens, 'Initial token balance').to.be.bignumber.equal(new BN(0));

            let mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(new BN(0));

            await token.transfer(supporters.address, EARNINGS, { from: payer });

            await expectRevert(supporters.distribute({ from: payer }), 'Not ready to distribute');

            await supporters.stake(BALANCE_USER1, { from: user1 });

            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            tokens = await supporters.getTokens();
            expect(tokens, 'Final token balance').to.be.bignumber.equal(BALANCE_USER1);

            mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(FINAL_BALANCE);
        });
    });

    describe('Staking', () => {
        const INITIAL_BALANCE = BALANCE_USER1;
        const EARNINGS = new BN(web3.utils.toWei('1', 'ether'));
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS);

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));

            await governor.mint(token.address, user1, BALANCE_USER1);
            await governor.mint(token.address, payer, BALANCE_PAYER);

            // Need to stake twice
            await token.approve(supporters.address, BALANCE_USER1.mul(new BN(2)), { from: user1 });

            await supporters.stake(BALANCE_USER1, { from: user1 });
        });

        it('stake and withdraw', async () => {
            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(new BN(0));

            await supporters.withdraw(BALANCE_USER1, { from: user1 });

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(BALANCE_USER1);
        });

        it('stake and partial withdraw', async () => {
            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(new BN(0));

            const withdrawTokens = tokens.div(new BN(3));
            const remainingTokens = tokens.sub(withdrawTokens);
            await supporters.withdraw(withdrawTokens, { from: user1 });

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(remainingTokens);

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(withdrawTokens);
        });

        it('distribute earnings', async () => {
            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial token balance').to.be.bignumber.equal(INITIAL_BALANCE);

            let mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(INITIAL_BALANCE);

            await token.transfer(supporters.address, EARNINGS, { from: payer });

            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final token balance').to.be.bignumber.equal(INITIAL_BALANCE);

            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(FINAL_BALANCE);
        });

        it('withdraw', async () => {
            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial tokens').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Initial token balance').to.be.bignumber.equal(BALANCE_USER1);

            await token.transfer(supporters.address, EARNINGS, { from: payer });

            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            const EXPECTED_BALANCE = FINAL_BALANCE.mul(BALANCE_USER1).div(INITIAL_BALANCE);
            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Expected user MOC balance').to.be.bignumber.equal(EXPECTED_BALANCE);

            await supporters.withdraw(BALANCE_USER1, { from: user1 });

            const balance = await token.balanceOf(user1);
            expect(balance, 'Final user MOC balance').to.be.bignumber.equal(EXPECTED_BALANCE);

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));
        });

        it('staking after early withdraw', async () => {
            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial tokens').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await token.transfer(supporters.address, EARNINGS, { from: payer });

            mocs = await token.balanceOf(supporters.address);
            expect(mocs, 'MOC balance').to.be.bignumber.equal(FINAL_BALANCE);

            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            const receipt = await supporters.withdraw(BALANCE_USER1, { from: user1 });
            expectEvent(receipt, 'WithdrawStake');

            const WITHDRAWN = helpers.findEvent(receipt.logs, 'WithdrawStake').args.mocs;
            const REMAINING = FINAL_BALANCE.sub(WITHDRAWN);

            mocs = await token.balanceOf(user1);
            expect(mocs, 'MOC balance').to.be.bignumber.equal(WITHDRAWN);

            mocs = await token.balanceOf(supporters.address);
            expect(mocs, 'MOC balance').to.be.bignumber.equal(REMAINING);

            tokens = await supporters.getTokens();
            expect(tokens, 'Token balance').to.be.bignumber.equal(new BN(0));

            mocs = await supporters.getAvailableMOC();
            expect(mocs, 'MOC balance').to.be.bignumber.equal(new BN(0));

            await supporters.stake(BALANCE_USER1, { from: user1 });

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(BALANCE_USER1);

            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(BALANCE_USER1);
        });
    });

    describe('Multiple stakes', () => {
        const INITIAL_BALANCE = BALANCE_USER1.add(BALANCE_USER2).add(BALANCE_USER3);
        const EARNINGS = new BN(web3.utils.toWei('1', 'ether'));
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS);
        let latestBlock;
        let endBlock;

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));

            await governor.mint(token.address, user1, BALANCE_USER1);
            await governor.mint(token.address, user2, BALANCE_USER2);
            await governor.mint(token.address, user3, BALANCE_USER3);
            await governor.mint(token.address, payer, BALANCE_PAYER);

            await token.approve(supporters.address, BALANCE_USER1, { from: user1 });
            await token.approve(supporters.address, BALANCE_USER2, { from: user2 });
            await token.approve(supporters.address, BALANCE_USER3, { from: user3 });
            await token.approve(supporters.address, BALANCE_PAYER, { from: payer });

            await supporters.stake(BALANCE_USER1, { from: user1 });
            await supporters.stake(BALANCE_USER2, { from: user2 });
            await supporters.stake(BALANCE_USER3, { from: user3 });
        });

        it('single withdrawal', async () => {
            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await token.transfer(supporters.address, EARNINGS, { from: payer });
            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            const EXPECTED_BALANCE_USER1 = FINAL_BALANCE.mul(BALANCE_USER1).div(INITIAL_BALANCE);
            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'User MOC balance').to.be.bignumber.equal(EXPECTED_BALANCE_USER1);

            await supporters.withdraw(BALANCE_USER1, { from: user1 });

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(EXPECTED_BALANCE_USER1);

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            mocs = await supporters.getMOCBalance(user1);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(new BN(0));
        });

        it('multiple withdrawals', async () => {
            await token.transfer(supporters.address, EARNINGS, { from: payer });
            await supporters.distribute({ from: payer });

            await helpers.mineBlocks(10);

            const users = [user1, user2, user3];

            await users.reduce((seq, user) => {
                return seq.then(async () => {
                    let tokens = await supporters.getBalance(user);

                    const tokenSupporters = await supporters.getTokens();
                    const mocsSupporters = await supporters.getAvailableMOC();
                    const expectedBalance = tokens.mul(mocsSupporters).div(tokenSupporters);

                    const mocs = await supporters.getMOCBalance(user);
                    expect(mocs, 'Expected user MOC balance').to.be.bignumber.equal(
                        expectedBalance,
                    );

                    await supporters.withdraw(tokens, { from: user });

                    tokens = await token.balanceOf(user);
                    expect(tokens, 'Final user MOC balance').to.be.bignumber.equal(expectedBalance);
                });
            }, Promise.resolve());

            const EXPECTED_BALANCE = FINAL_BALANCE.div(new BN(3));
            let mocs = await token.balanceOf(user1);
            expect(mocs, 'User MOC balance').to.be.bignumber.equal(EXPECTED_BALANCE);

            // Last user to exit withdraws the accumulated rounding error
            const ROUNDING_ERROR = FINAL_BALANCE.mod(new BN(3));
            mocs = await token.balanceOf(user3);
            expect(mocs, 'User MOC balance').to.be.bignumber.equal(
                EXPECTED_BALANCE.add(ROUNDING_ERROR),
            );

            const tokens = await supporters.getTokens();
            expect(tokens, 'Final token balance').to.be.bignumber.equal(new BN(0));

            mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(new BN(0));
        });

        it('multiple earlier withdrawals', async () => {
            await token.transfer(supporters.address, EARNINGS, { from: payer });
            await supporters.distribute({ from: payer });

            // await helpers.mineBlocks(5)

            const users = [user1, user2, user3];

            const withdrawn = await users.reduce((seq, user) => {
                return seq.then(async (withdrawn) => {
                    const tokens = await supporters.getBalance(user);

                    const receipt = await supporters.withdraw(tokens, { from: user });
                    expectEvent(receipt, 'WithdrawStake');

                    const mocs = helpers.findEvent(receipt.logs, 'WithdrawStake').args.mocs;

                    return withdrawn.add(mocs);
                });
            }, Promise.resolve(new BN(0)));

            let mocs = await supporters.getAvailableMOC();
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(supporters.address);
            expect(mocs, 'Final MOC balance').to.be.bignumber.equal(FINAL_BALANCE.sub(withdrawn));
        });
    });

    describe('Subaccounts', () => {
        const INITIAL_BALANCE = BALANCE_USER1.add(BALANCE_USER1);
        const EARNINGS = new BN(web3.utils.toWei('1', 'ether'));
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS);

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));

            await governor.mint(token.address, user1, INITIAL_BALANCE);
            await governor.mint(token.address, user2, BALANCE_USER2);
            await governor.mint(token.address, user3, BALANCE_USER3);
            await governor.mint(token.address, payer, BALANCE_PAYER);

            await token.approve(supporters.address, INITIAL_BALANCE, { from: user1 });
        });

        it('stake', async () => {
            await supporters.stake(BALANCE_USER1, { from: user1 });

            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.stakeAt(BALANCE_USER1, user3, { from: user1 });

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(BALANCE_USER1);

            tokens = await supporters.getBalance(user3);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(BALANCE_USER1);

            tokens = await supporters.getBalanceAt(user3, user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(new BN(0));
        });

        it('withdraw', async () => {
            await supporters.stake(BALANCE_USER1, { from: user1 });

            let tokens = await supporters.getBalance(user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.stakeAt(BALANCE_USER1, user3, { from: user1 });

            await supporters.withdraw(BALANCE_USER1, { from: user1 });

            tokens = await supporters.getBalance(user1);
            expect(tokens, 'User token balance').to.be.bignumber.equal(new BN(0));

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'User subaccount token balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.withdrawFrom(BALANCE_USER1, user3, { from: user1 });

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'Final user subaccount token balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(INITIAL_BALANCE);
        });
    });

    describe.skip('Stake HUGE amount', () => {
        // There is a limit to the token total supply.....
        const USER1_BALANCE = new BN(2).pow(new BN(129));
        const USER2_BALANCE = new BN(2).pow(new BN(129));
        const USER3_BALANCE = new BN(2).pow(new BN(126));
        const PAYER_BALANCE = new BN(2).pow(new BN(129)).sub(new BN(1));

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await SupportersMock.new();
            await supporters.initialize(token.address, new BN(10));

            await governor.mint(token.address, user1, USER1_BALANCE);
            await governor.mint(token.address, user2, USER2_BALANCE);
            await governor.mint(token.address, user3, USER3_BALANCE);
            await governor.mint(token.address, payer, PAYER_BALANCE);
        });

        async function print() {
            const mocsBin = await supporters.getAvailableMOC();
            console.log(
                'Total Mocs',
                mocsBin.toString(16),
                mocsBin.toString(2),
                mocsBin.toString(2).length,
            );
            const tokenBin = await supporters.getTokens();
            console.log(
                'Total tokens',
                tokenBin.toString(16),
                tokenBin.toString(2),
                tokenBin.toString(2).length,
            );
        }

        it('stake a lot', async () => {
            await token.approve(supporters.address, USER1_BALANCE, { from: user1 });
            await supporters.stake(USER1_BALANCE, { from: user1 });
            // Here we do: _tokens.mul(totalMocs).div(totalTokens) aka token ** 2 == mocs ** 2
            await expectRevert(
                supporters.getMOCBalance(user1),
                'SafeMath: multiplication overflow',
            );

            await print();

            await token.approve(supporters.address, USER2_BALANCE, { from: user2 });
            // Here we do: _mocs.mul(totalTokens).div(totalMocs); PROBLEM: totalTokens == 2 ** 128
            // 129+126 == 255
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            await supporters.stake(USER2_BALANCE.div(new BN(8)), { from: user2 });
            expect(await supporters.getMOCBalance(user2)).to.be.bignumber.equal(USER2_BALANCE);
            await print();

            await token.approve(supporters.address, USER3_BALANCE, { from: user3 });
            await supporters.stake(USER3_BALANCE, { from: user3 });
            expect(await supporters.getMOCBalance(user3)).to.be.bignumber.equal(USER3_BALANCE);
            // 129+129-3 == 255
            await print();

            await token.transfer(supporters.address, PAYER_BALANCE, { from: payer });
            await print();
            // await supporters.distribute({ from: payer });
            // await helpers.mineBlocks(10);
            // await supporters.distribute({ from: payer });

            // await expectRevert(supporters.withdraw(new BN(10), { from: user1 }), 'SafeMath: multiplication overflow');

            // expect(await supporters.getMOCBalance(user1), 'user1 token balance').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getBalance(user1), 'user1 token balance').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getAvailableMOC(), 'total mocs').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getTokens(), ' total token').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getBalance(user2), 'user2 token balance').to.be.bignumber.equal(BIGNUMBER);

            //
            // expect(await supporters.getBalance(user1), 'user1 token balance after').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getAvailableMOC(), 'Final total mocs').to.be.bignumber.equal(BIGNUMBER);
            // expect(await supporters.getTokens(), 'Final total token').to.be.bignumber.equal(BIGNUMBER);
        });
    });
});
