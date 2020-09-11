const helpers = require('./helpers');
const {BN} = require('@openzeppelin/test-helpers');

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
                mocBalanceAfterWithdrawal: '2', // Moc balance after first withdrawal
                tokenBalanceAfterWithdrawal: '1', // Token balance after first withdrawal
                delayMocBalanceChangeAfterWithdrawal: '0', // Delay machine balance after first withdrawal
                otherUserMocBalanceAfterSecondDeposit: '0', // Moc balance after other user's deposit
                otherUserTokenBalanceAfterSecondDeposit: '0', // Token balance after other user's deposit
                otherDelayBalanceAfterSecondWithdrawal: '0', // Delay machine balance after other user's withdrawal
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
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
                    "alice deposits 1, has 1 reward, bob deposits 1, alice can't withdraw 1 MOC",
                amount: '1',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '3',
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
                    "alice deposits 1, has 1 reward, bob deposits 1, alice can't withdraw 2 MOC",
                amount: '1',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '3',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '0',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '5',
                description:
                    'alice deposits 1, has 1 reward, bob deposits 1, alice can withdraw 3 MOC',
                amount: '1',
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
                    "alice deposits 2, has 1 reward, bob deposits 1, alice can't withdraw 1 MOC",
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '1',
                mocBalanceAfterWithdrawal: '4',
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
                    'alice deposits 2, has 1 reward, bob deposits 1, alice can withdraw 2 MOC',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '2',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '11',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 1, alice tries to withdraw 3, withdraws 2 MOC',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '3',
                mocBalanceAfterWithdrawal: '2',
                tokenBalanceAfterWithdrawal: '1',
                delayMocBalanceChangeAfterWithdrawal: '2',
                otherUserMocBalanceAfterSecondDeposit: '0',
                otherUserTokenBalanceAfterSecondDeposit: '0',
                otherDelayBalanceAfterSecondWithdrawal: '0',
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
            },
            {
                testNumber: '12',
                description:
                    'alice deposits 2, has 1 reward, bob deposits 1 (alice can withdraw it), alice can withdraw 4 MOC',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '4',
                mocBalanceAfterWithdrawal: '0',
                tokenBalanceAfterWithdrawal: '0',
                delayMocBalanceChangeAfterWithdrawal: '4',
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
                testNumber: '18',
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
                mocBalanceAfterReset: '0',
                tokenBalanceAfterReset: '0',
                mocBalanceAfterReset: '2',
                tokenBalanceAfterReset: '1',
            },
            {
                testNumber: '19',
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
                testNumber: '20',
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
                testNumber: '22',
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
        ];
        for (let i = 0; i < testValues.length; i++) {
            it(testValues[i].testNumber + ': ' + testValues[i].description, async () => {
                console.log('Test number:', testValues[i].testNumber);
                // Previous approve for deposit in StakingMock
                await this.token.approve(this.staking.address, testValues[i].amount, {
                    from: ALICE,
                });
                console.log(
                    'Making deposit of',
                    testValues[i].amount,
                    'mocs by ALICE<---------------',
                );
                // Deposit mocs in StakingMock
                await this.staking.deposit(testValues[i].amount, ALICE, {
                    from: ALICE,
                });

                const mocBalanceAfterFirstDeposit = await this.staking.getBalance(ALICE);
                const tokenBalanceAfterFirstDeposit = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                console.log(
                    "ALICE's moc balance after first deposit",
                    mocBalanceAfterFirstDeposit.toString(),
                );
                console.log(
                    "ALICE's token balance after first deposit",
                    tokenBalanceAfterFirstDeposit.toString(),
                );

                // Check the owner's stake in mocs was deposited
                assert.isTrue(mocBalanceAfterFirstDeposit.eq(new BN(testValues[i].amount)));
                // Check the internal token balance was added.
                assert.isTrue(tokenBalanceAfterFirstDeposit.eq(new BN(testValues[i].amount)));

                // Check Supporters's balance before reward deposit
                const supportersBalanceBeforeTransfer = await this.token.balanceOf(
                    this.supporters.address,
                );
                console.log(
                    'Transfering',
                    testValues[i].reward,
                    'mocs to Supporters <---------------',
                );
                // Transfer rewards to Supporters contract to increase moc balance in it
                await this.token.transfer(this.supporters.address, testValues[i].reward, {
                    from: REWARDS,
                });
                console.log('Calling distribute() in Supporters <---------------');
                // Call distribute to update Supporters' total moc balance
                await this.supporters.distribute({
                    from: REWARDS,
                });

                // Check Supporters's balance after reward deposit
                const supportersBalanceAfterTransfer = await this.token.balanceOf(
                    this.supporters.address,
                );
                // Check Supporters's balance changed correctly
                assert.isTrue(
                    supportersBalanceAfterTransfer
                        .sub(supportersBalanceBeforeTransfer)
                        .eq(new BN(testValues[i].reward)),
                );

                // Check delay machine previous token balance to compare later
                const delayMocBalanceBeforeWithdrawal = await this.token.balanceOf(
                    this.delayMachine.address,
                );

                await helpers.mineBlocks(period);

                if (testValues[i].addAmount !== '0') {
                    const mocBalanceBeforeOtherDeposit = await this.staking.getBalance(ALICE);
                    const tokenBalanceBeforeOtherDeposit = await this.stakingMock.getBalanceInTokens(
                        ALICE,
                    );
                    const otherUserMocBalanceBeforeOtherDeposit = await this.staking.getBalance(
                        BOB,
                    );
                    const otherUserTokenBalanceBeforeOtherDeposit = await this.stakingMock.getBalanceInTokens(
                        BOB,
                    );
                    console.log(
                        "ALICE's moc balance before BOB's deposit",
                        mocBalanceBeforeOtherDeposit.toString(),
                    );
                    console.log(
                        "ALICE's token balance before BOB's deposit",
                        tokenBalanceBeforeOtherDeposit.toString(),
                    );
                    console.log(
                        "BOB's moc balance before BOB's deposit",
                        otherUserMocBalanceBeforeOtherDeposit.toString(),
                    );
                    console.log(
                        "BOB's token balance before BOB's deposit",
                        otherUserTokenBalanceBeforeOtherDeposit.toString(),
                    );

                    // Previous approve for deposit in Staking
                    await this.token.approve(this.staking.address, testValues[i].addAmount, {
                        from: BOB,
                    });
                    console.log(
                        "Total mocs before BOB's deposit:",
                        (await this.staking.totalMoc()).toString(),
                        '//',
                        "Total tokens before BOB's deposit:",
                        (await this.staking.totalToken()).toString(),
                    );
                    console.log(
                        "Making BOB's deposit of",
                        testValues[i].addAmount,
                        'mocs <---------------',
                    );
                    // Deposit mocs in Staking
                    await this.staking.deposit(testValues[i].addAmount, BOB, {
                        from: BOB,
                    });
                    console.log(
                        "Total mocs after BOB's deposit:",
                        (await this.staking.totalMoc()).toString(),
                        '//',
                        "Total tokens after BOB's deposit:",
                        (await this.staking.totalToken()).toString(),
                    );
                    const otherUserMocBalanceAfterSecondDeposit = await this.staking.getBalance(
                        BOB,
                    );
                    const otherUserTokenBalanceAfterSecondDeposit = await this.stakingMock.getBalanceInTokens(
                        BOB,
                    );
                    console.log(
                        "BOB's moc balance after deposit:",
                        otherUserMocBalanceAfterSecondDeposit.toString(),
                        'Expected:',
                        testValues[i].otherUserMocBalanceAfterSecondDeposit,
                    );
                    console.log(
                        "BOB's token balance after deposit",
                        otherUserTokenBalanceAfterSecondDeposit.toString(),
                        'Expected:',
                        testValues[i].otherUserTokenBalanceAfterSecondDeposit,
                    );
                    // Check the other user's stake in mocs was deposited
                    assert.isTrue(
                        otherUserMocBalanceAfterSecondDeposit.eq(
                            new BN(testValues[i].otherUserMocBalanceAfterSecondDeposit),
                        ),
                    );
                    // Check the other user's token balance was correctly deposited
                    assert.isTrue(
                        otherUserTokenBalanceAfterSecondDeposit.eq(
                            new BN(testValues[i].otherUserTokenBalanceAfterSecondDeposit),
                        ),
                    );
                }

                const mocBalanceBeforeWithdrawal = await this.staking.getBalance(ALICE);
                const tokenBalanceBeforeWithdrawal = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                console.log(
                    "ALICE's moc balance before withdrawal",
                    mocBalanceBeforeWithdrawal.toString(),
                );
                console.log(
                    "ALICE's token balance before withdrawal",
                    tokenBalanceBeforeWithdrawal.toString(),
                );

                console.log('Making withdrawal of', testValues[i].withdrawAmount, 'mocs by ALICE');
                // Withdraw an amount of stake taken from the list
                await this.staking.withdraw(testValues[i].withdrawAmount, {
                    from: ALICE,
                });

                // Check delay machine moc balance after withdrawal
                const delayMocBalanceAfterWithdrawal = await this.token.balanceOf(
                    this.delayMachine.address,
                );
                const delayMocBalanceChangeAfterWithdrawal = delayMocBalanceAfterWithdrawal.sub(
                    delayMocBalanceBeforeWithdrawal,
                );
                console.log(
                    "Delay Machine's moc balance change after withdrawal:",
                    delayMocBalanceChangeAfterWithdrawal.toString(),
                    'Expected:',
                    testValues[i].delayMocBalanceChangeAfterWithdrawal,
                );
                // Assert that delay machine received the amount withdrawn
                assert.isTrue(
                    delayMocBalanceChangeAfterWithdrawal.eq(
                        new BN(testValues[i].delayMocBalanceChangeAfterWithdrawal),
                    ),
                );

                const mocBalanceAfterWithdrawal = await this.staking.getBalance(ALICE);
                const tokenBalanceAfterWithdrawal = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                console.log(
                    "ALICE's moc balance after withdrawal:",
                    mocBalanceAfterWithdrawal.toString(),
                    'Expected:',
                    testValues[i].mocBalanceAfterWithdrawal,
                );
                console.log(
                    "ALICE's token balance after withdrawal:",
                    tokenBalanceAfterWithdrawal.toString(),
                    'Expected:',
                    testValues[i].tokenBalanceAfterWithdrawal,
                );

                // Check moc balance of user after withdrawal
                assert.isTrue(
                    mocBalanceAfterWithdrawal.eq(new BN(testValues[i].mocBalanceAfterWithdrawal)),
                );

                // Check the internal token balance.
                assert.isTrue(
                    tokenBalanceAfterWithdrawal.eq(
                        new BN(testValues[i].tokenBalanceAfterWithdrawal),
                    ),
                );

                console.log(
                    'ALICE withdraws the rest of the stake to reset it, which is',
                    mocBalanceAfterWithdrawal.toString(),
                    'mocs',
                );
                // Withdraw the rest of the stake to reset it
                await this.staking.withdraw(mocBalanceAfterWithdrawal, {from: ALICE});
                const mocBalanceAfterReset = await this.staking.getBalance(ALICE);
                const tokenBalanceAfterReset = await this.stakingMock.getBalanceInTokens(ALICE);
                console.log(
                    "ALICE's moc balance after reset:",
                    mocBalanceAfterReset.toString(),
                    'Expected:',
                    testValues[i].mocBalanceAfterReset,
                );
                console.log(
                    "ALICE's token balance after reset:",
                    tokenBalanceAfterReset.toString(),
                    'Expected:',
                    testValues[i].tokenBalanceAfterReset,
                );
                // Check the owner's moc balance is 0.
                assert.isTrue(mocBalanceAfterReset.eq(new BN(testValues[i].mocBalanceAfterReset)));
                // Check the owner's internal token balance is 0.
                assert.isTrue(
                    tokenBalanceAfterReset.eq(new BN(testValues[i].tokenBalanceAfterReset)),
                );

                /*
                console.log('Making other user\'s withdrawal of', testValues[i].withdrawAmount, 'mocs');
                // Withdraw an amount of stake taken from the list
                await this.staking.withdraw(testValues[i].withdrawAmount, {from: bob});
                */

                console.log('///////////////////////////////////////////////////////////');
            });
        }
    });
});
