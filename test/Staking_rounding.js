const helpers = require('./helpers');
const {BN} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const log = () => {};

contract('Staking_rounding', async (accounts) => {
    const REWARDS = accounts[1];
    const ALICE = accounts[2];
    const BOB = accounts[4];

    const minCPSubscriptionStake = (10 ** 18).toString();
    const period = 3;

    beforeEach(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: accounts[8],
            period,
            minSubscriptionStake: minCPSubscriptionStake,
        });
        Object.assign(this, contracts);
        await this.governor.mint(this.token.address, REWARDS, '800000000000000000000');
        await this.governor.mint(this.token.address, ALICE, '800000000000000000000');
        await this.governor.mint(this.token.address, BOB, '800000000000000000000');
    });

    async function testIt(testValue, token, staking, stakingMock, supporters, delayMachine) {
        log('Test number:', testValue.testNumber);
        // Previous approve for deposit in Staking
        await token.approve(staking.address, testValue.amount, {
            from: ALICE,
        });
        log('Making deposit of', testValue.amount, 'mocs by ALICE<---------------');
        // Deposit mocs in Staking
        await staking.deposit(testValue.amount, ALICE, {
            from: ALICE,
        });

        const mocBalanceAfterFirstDeposit = await staking.getBalance(ALICE);
        const tokenBalanceAfterFirstDeposit = await stakingMock.getBalanceInTokens(ALICE);
        log("ALICE's moc balance after first deposit", mocBalanceAfterFirstDeposit.toString());
        log("ALICE's token balance after first deposit", tokenBalanceAfterFirstDeposit.toString());

        // Check the owner's stake in mocs was deposited
        expect(mocBalanceAfterFirstDeposit, 'mocBalanceAfterFirstDeposit').to.be.bignumber.equal(
            new BN(testValue.amount),
        );
        // Check the internal token balance was added.
        expect(
            tokenBalanceAfterFirstDeposit,
            'tokenBalanceAfterFirstDeposit',
        ).to.be.bignumber.equal(new BN(testValue.amount));

        // Check Supporters's balance before reward deposit
        const supportersBalanceBeforeTransfer = await token.balanceOf(supporters.address);
        log('Transfering', testValue.reward, 'mocs to Supporters <---------------');
        // Transfer rewards to Supporters contract to increase moc balance in it
        await token.transfer(supporters.address, testValue.reward, {
            from: REWARDS,
        });
        log('Calling distribute() in Supporters <---------------');
        // Call distribute to update Supporters' total moc balance
        await supporters.distribute({
            from: REWARDS,
        });

        // Check Supporters's balance after reward deposit
        const supportersBalanceAfterTransfer = await token.balanceOf(supporters.address);
        // Check Supporters's balance changed correctly
        expect(
            supportersBalanceAfterTransfer.sub(supportersBalanceBeforeTransfer),
            'supportersBalanceAfterTransfer.sub(supportersBalanceBeforeTransfer)',
        ).to.be.bignumber.equal(new BN(testValue.reward));

        // Check delay machine previous token balance to compare later
        const delayMocBalanceBeforeWithdrawal = await token.balanceOf(delayMachine.address);

        await helpers.mineBlocks(period);

        if (testValue.addAmount !== '0') {
            const mocBalanceBeforeOtherDeposit = await staking.getBalance(ALICE);
            const tokenBalanceBeforeOtherDeposit = await stakingMock.getBalanceInTokens(ALICE);
            const otherUserMocBalanceBeforeOtherDeposit = await staking.getBalance(BOB);
            const otherUserTokenBalanceBeforeOtherDeposit = await stakingMock.getBalanceInTokens(
                BOB,
            );
            log(
                "ALICE's moc balance before BOB's deposit",
                mocBalanceBeforeOtherDeposit.toString(),
            );
            log(
                "ALICE's token balance before BOB's deposit",
                tokenBalanceBeforeOtherDeposit.toString(),
            );
            log(
                "BOB's moc balance before BOB's deposit",
                otherUserMocBalanceBeforeOtherDeposit.toString(),
            );
            log(
                "BOB's token balance before BOB's deposit",
                otherUserTokenBalanceBeforeOtherDeposit.toString(),
            );

            // Previous approve for deposit in Staking
            await token.approve(staking.address, testValue.addAmount, {
                from: BOB,
            });
            log(
                "Total mocs before BOB's deposit:",
                (await staking.totalMoc()).toString(),
                '//',
                "Total tokens before BOB's deposit:",
                (await staking.totalToken()).toString(),
            );
            log("Making BOB's deposit of", testValue.addAmount, 'mocs <---------------');
            // Deposit mocs in Staking
            await staking.deposit(testValue.addAmount, BOB, {
                from: BOB,
            });
            log(
                "Total mocs after BOB's deposit:",
                (await staking.totalMoc()).toString(),
                '//',
                "Total tokens after BOB's deposit:",
                (await staking.totalToken()).toString(),
            );
            const otherUserMocBalanceAfterSecondDeposit = await staking.getBalance(BOB);
            const otherUserTokenBalanceAfterSecondDeposit = await stakingMock.getBalanceInTokens(
                BOB,
            );
            log(
                "BOB's moc balance after deposit:",
                otherUserMocBalanceAfterSecondDeposit.toString(),
                'Expected:',
                testValue.otherUserMocBalanceAfterSecondDeposit,
            );
            log(
                "BOB's token balance after deposit",
                otherUserTokenBalanceAfterSecondDeposit.toString(),
                'Expected:',
                testValue.otherUserTokenBalanceAfterSecondDeposit,
            );
            // Check the other user's stake in mocs was deposited
            expect(
                otherUserMocBalanceAfterSecondDeposit,
                'otherUserMocBalanceAfterSecondDeposit',
            ).to.be.bignumber.equal(new BN(testValue.otherUserMocBalanceAfterSecondDeposit));
            // Check the other user's token balance was correctly deposited
            expect(
                otherUserTokenBalanceAfterSecondDeposit,
                'otherUserTokenBalanceAfterSecondDeposit',
            ).to.be.bignumber.equal(new BN(testValue.otherUserTokenBalanceAfterSecondDeposit));
        }

        const mocBalanceBeforeWithdrawal = await staking.getBalance(ALICE);
        const tokenBalanceBeforeWithdrawal = await stakingMock.getBalanceInTokens(ALICE);
        log("ALICE's moc balance before withdrawal", mocBalanceBeforeWithdrawal.toString());
        log("ALICE's token balance before withdrawal", tokenBalanceBeforeWithdrawal.toString());

        log('Making withdrawal of', testValue.withdrawAmount, 'mocs by ALICE');
        // Withdraw an amount of stake taken from the list
        await staking.withdraw(testValue.withdrawAmount, {
            from: ALICE,
        });

        // Check delay machine moc balance after withdrawal
        const delayMocBalanceAfterWithdrawal = await token.balanceOf(delayMachine.address);
        const delayMocBalanceChangeAfterWithdrawal = delayMocBalanceAfterWithdrawal.sub(
            delayMocBalanceBeforeWithdrawal,
        );
        log(
            "Delay Machine's moc balance change after withdrawal:",
            delayMocBalanceChangeAfterWithdrawal.toString(),
            'Expected:',
            testValue.delayMocBalanceChangeAfterWithdrawal,
        );
        // Assert that delay machine received the amount withdrawn
        expect(
            delayMocBalanceChangeAfterWithdrawal,
            'delayMocBalanceChangeAfterWithdrawal',
        ).to.be.bignumber.equal(new BN(testValue.delayMocBalanceChangeAfterWithdrawal));

        const mocBalanceAfterWithdrawal = await staking.getBalance(ALICE);
        const tokenBalanceAfterWithdrawal = await stakingMock.getBalanceInTokens(ALICE);
        log(
            "ALICE's moc balance after withdrawal:",
            mocBalanceAfterWithdrawal.toString(),
            'Expected:',
            testValue.mocBalanceAfterWithdrawal,
        );
        log(
            "ALICE's token balance after withdrawal:",
            tokenBalanceAfterWithdrawal.toString(),
            'Expected:',
            testValue.tokenBalanceAfterWithdrawal,
        );

        // Check moc balance of user after withdrawal
        expect(mocBalanceAfterWithdrawal, 'mocBalanceAfterWithdrawal').to.be.bignumber.equal(
            new BN(testValue.mocBalanceAfterWithdrawal),
        );

        // Check the internal token balance.
        expect(tokenBalanceAfterWithdrawal, 'tokenBalanceAfterWithdrawal').to.be.bignumber.equal(
            new BN(testValue.tokenBalanceAfterWithdrawal),
        );

        log(
            'ALICE withdraws the rest of the stake to reset it, which is',
            mocBalanceAfterWithdrawal.toString(),
            'mocs',
        );
        // Withdraw the rest of the stake to reset it
        await staking.withdraw(mocBalanceAfterWithdrawal, {from: ALICE});
        const mocBalanceAfterReset = await staking.getBalance(ALICE);
        const tokenBalanceAfterReset = await stakingMock.getBalanceInTokens(ALICE);
        log(
            "ALICE's moc balance after reset:",
            mocBalanceAfterReset.toString(),
            'Expected:',
            testValue.mocBalanceAfterReset,
        );
        log(
            "ALICE's token balance after reset:",
            tokenBalanceAfterReset.toString(),
            'Expected:',
            testValue.tokenBalanceAfterReset,
        );
        // Check the owner's moc balance is 0.
        expect(mocBalanceAfterReset, 'mocBalanceAfterReset').to.be.bignumber.equal(
            new BN(testValue.mocBalanceAfterReset),
        );
        // Check the owner's internal token balance is 0.
        expect(tokenBalanceAfterReset, 'tokenBalanceAfterReset').to.be.bignumber.equal(
            new BN(testValue.tokenBalanceAfterReset),
        );

        /*
        log('Making other user\'s withdrawal of', testValues[i].withdrawAmount, 'mocs');
        // Withdraw an amount of stake taken from the list
        await staking.withdraw(testValues[i].withdrawAmount, {from: bob});
        */
        log('///////////////////////////////////////////////////////////');
    }

    // IS ONLY POSSIBLE TO DEPOSIT OR WITHDRAW MULTIPLES OF THE TOKEN VALUE IN MOCS!!!
    describe('Should check several problematic cases where an oracle might loose mocs when making deposits or withdrawals', async () => {
        const testValues = [
            {
                testNumber: '1',
                description: "alice deposits 1, has 1 reward, can't remove 1 MOC",
                amount: '1', // Amount deposited to test
                reward: '1', // Amount transfered as reward
                addAmount: '0', // Amount deposited by another account
                withdrawAmount: '1', // Amount withdrawn by original account
                mocBalanceAfterWithdrawal: '2', // Moc balance in first user account after first withdrawal
                tokenBalanceAfterWithdrawal: '1', // Token balance in first user account after first withdrawal
                delayMocBalanceChangeAfterWithdrawal: '0', // Delay machine balance after first withdrawal
                otherUserMocBalanceAfterSecondDeposit: '0', // Moc balance in first user account after other user's deposit
                otherUserTokenBalanceAfterSecondDeposit: '0', // Token balance in first user account after other user's deposit
                otherDelayBalanceAfterSecondWithdrawal: '0', // Delay machine balance after other user's withdrawal
                mocBalanceAfterReset: '0', // Moc balance after resetting it to 0 with a withdrawal
                tokenBalanceAfterReset: '0', // Token balance after resetting it to 0 with a withdrawal
            },
            {
                testNumber: '2',
                description: 'alice deposits 1, has 1 reward, can remove 2 MOC',
                amount: '1',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '3',
                description:
                    "alice deposits 1, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can't withdraw 1 MOC",
                amount: '1',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '4',
                description:
                    'alice deposits 1, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can withdraw 2 MOC',
                amount: '1',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '5',
                description:
                    'alice deposits 1, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can withdraw 3 MOC',
                amount: '1',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '3',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '6',
                description: "alice deposits 2, has 1 reward, alice can't withdraw 1 MOC",
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '3',
                tokenBalanceAfterWithdrawal: '2',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '7',
                // TODO: Check the same situation with bob participating.
                description:
                    'alice deposits 2, has 1 reward, alice tries to withdraw 2, withdraws 1 MOC',
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '1',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '8',
                description: 'alice deposits 2, has 1 reward, alice can withdraw 3 MOC',
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '3',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '3',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '9',
                description:
                    "alice deposits 2, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can't withdraw 1 MOC",
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '3',
                tokenBalanceAfterWithdrawal: '2',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '10',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can withdraw 2 MOC and gets 1 MOC',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '1',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '11',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice tries to withdraw 3, and gets 3 MOC',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '3',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '3',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '12',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 1 (not enough to buy he gets nothing), alice can withdraw 4 MOC but gets 3',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '4',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '3',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '13',
                description:
                    "alice deposits 1, has 1 reward, bob deposits 2, alice can't withdraw 1 MOC",
                amount: '1',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '2',
                otherUserTokenBalanceAfterSecondDeposit: '1',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '14',
                description:
                    'alice deposits 1, has 1 reward, bob deposits 2, alice can withdraw 2 MOC',
                amount: '1',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '2',
                otherUserTokenBalanceAfterSecondDeposit: '1',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '15',
                description:
                    "alice deposits 2, has 1 reward, bob deposits 2 and gets 1, alice can't withdraw 1",
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '3',
                tokenBalanceAfterWithdrawal: '2',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '1',
                otherUserTokenBalanceAfterSecondDeposit: '1',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                // Alice withdraw her balance == 3
                mocBalanceAfterReset: '2',
                tokenBalanceAfterReset: '1',
            },
            {
                testNumber: '16',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 2 and gets 1, alice tries to withdraw 2, withdraws 1 MOC',
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '1',
                otherUserMocBalanceAfterSecondDeposit: '1',
                otherUserTokenBalanceAfterSecondDeposit: '1',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '17',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 2 and gets 1, alice tries to withdraw 3, withdraws 1 MOC',
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '3',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '1',
                otherUserMocBalanceAfterSecondDeposit: '1',
                otherUserTokenBalanceAfterSecondDeposit: '1',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '18',
                description:
                    "alice deposits 100, has 10000 reward, alice can't withdraw 100 MOC, must withdraw multiples of 101==10100/100",
                amount: '100', // Amount deposited to test
                reward: (100 * 100).toString(), // Amount transfered as reward
                addAmount: '0', // Amount deposited by another account
                withdrawAmount: '100', // Amount withdrawn by original account
                mocBalanceAfterWithdrawal: '10100', // Moc balance after first withdrawal
                tokenBalanceAfterWithdrawal: '100', // Token balance after first withdrawal
                delayMocBalanceChangeAfterWithdrawal: '0', // Delay machine balance after first withdrawal
                otherUserMocBalanceAfterSecondDeposit: '0', // Moc balance after other user's deposit
                otherUserTokenBalanceAfterSecondDeposit: '0', // Token balance after other user's deposit
                otherDelayBalanceAfterSecondWithdrawal: '0', // Delay machine balance after other user's withdrawal
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '19',
                description:
                    'alice deposits 100, has 10000 reward, alice withdraw 150 MOC and gets 1 token == 101',
                amount: '100',
                reward: (100 * 100).toString(), // Amount transferred as reward
                addAmount: '0',
                withdrawAmount: '150',
                mocBalanceAfterWithdrawal: '9999',
                tokenBalanceAfterWithdrawal: '99',
                delayMocBalanceChangeAfterWithdrawal: '101',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
        ];
        for (let i = 0; i < testValues.length; i++) {
            it(testValues[i].testNumber + ': ' + testValues[i].description, async () => {
                await testIt(
                    testValues[i],
                    this.token,
                    this.staking,
                    this.stakingMock,
                    this.supporters,
                    this.delayMachine,
                );
            });
        }
        it('alice deposits 100, has 10000 reward, bob deposit 150 and gets 1 token, alice withdraw 150 MOC and gets 1 token == 101', async () => {
            const bobBalanceBefore = await this.token.balanceOf(BOB);
            const bobApprovalBefore = await this.token.allowance(BOB, this.staking.address);
            await testIt(
                {
                    amount: '100',
                    reward: (100 * 100).toString(), // Amount transferred as reward
                    addAmount: '150',
                    withdrawAmount: '150',
                    mocBalanceAfterWithdrawal: '9999',
                    tokenBalanceAfterWithdrawal: '99',
                    delayMocBalanceChangeAfterWithdrawal: '101',
                    otherUserMocBalanceAfterSecondDeposit: '101',
                    otherUserTokenBalanceAfterSecondDeposit: '1',
                    otherDelayBalanceAfterSecondWithdrawal: '0',
                    mocBalanceAfterReset: '0',
                    tokenBalanceAfterReset: '0',
                },
                this.token,
                this.staking,
                this.stakingMock,
                this.supporters,
                this.delayMachine,
            );
            const bobBalanceAfter = await this.token.balanceOf(BOB);
            const bobApprovalAfter = await this.token.allowance(BOB, this.staking.address);
            expect(
                bobBalanceBefore.sub(bobBalanceAfter),
                "We only take what's needed from bob",
            ).to.be.bignumber.equal(new BN(101));
            expect(
                bobApprovalAfter.sub(bobApprovalBefore),
                'We leave the rest untouched',
            ).to.be.bignumber.equal(new BN(49));
        });
    });
});
