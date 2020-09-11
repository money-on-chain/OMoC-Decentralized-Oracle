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
        const originalTestValues = [
            {
                amount: (1).toString(), // Amount deposited to test
                reward: (1).toString(), // Amount transfered as reward
                addAmount: (0).toString(), // Amount deposited by another account
                withdrawAmount: (1).toString(), // Amount withdrawn by original account
                mocBalanceResult: (2).toString(), // Moc balance after first withdrawal
                tokenBalanceResult: (1).toString(), // Token balance after first withdrawal
                delayBalanceResult: (0).toString(), // Delay machine balance after first withdrawal
                otherMocBalanceResult: (0).toString(), // Moc balance after other user's deposit
                otherTokenBalanceResult: (0).toString(), // Token balance after other user's deposit
                otherDelayBalanceResult: (0).toString(), // Delay machine balance after other user's withdrawal
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (3).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (2).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (1).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (3).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (4).toString(),
                tokenBalanceResult: (2).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (4).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (4).toString(),
                otherMocBalanceResult: (0).toString(),
                otherTokenBalanceResult: (0).toString(),
                otherDelayBalanceResult: (0).toString(),
            },
        ];

        const testValues = [
            {
                description: "alice deposit 1 has 1 reward can't remove 1 MOC",
                amount: '1', // Amount deposited to test
                reward: '1', // Amount transfered as reward
                addAmount: '0', // Amount deposited by another account
                withdrawAmount: '1', // Amount withdrawn by original account
                mocBalanceResult: '2', // Moc balance after first withdrawal
                tokenBalanceResult: '1', // Token balance after first withdrawal
                delayBalanceResult: '0', // Delay machine balance after first withdrawal
                otherMocBalanceResult: '0', // Moc balance after other user's deposit
                otherTokenBalanceResult: '0', // Token balance after other user's deposit
                otherDelayBalanceResult: '0', // Delay machine balance after other user's withdrawal
            },
            {
                description: "alice deposit 1 has 1 reward can't remove 1MOC but can remove 2 MOC",
                amount: '1',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '2',
                mocBalanceResult: '0',
                tokenBalanceResult: '0',
                delayBalanceResult: '2',
                otherMocBalanceResult: '0',
                otherTokenBalanceResult: '0',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    "alice deposit 1 has 1 reward bob deposits 2mocs alice can't withdraw 1 MOC",
                amount: '1',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '1',
                mocBalanceResult: '2',
                tokenBalanceResult: '1',
                delayBalanceResult: '0',
                otherMocBalanceResult: '2',
                otherTokenBalanceResult: '1',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    'alice deposit 1 has 1 reward bob deposits 2mocs alice can withdraw 2 MOC',
                amount: '1',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '2',
                mocBalanceResult: '0',
                tokenBalanceResult: '0',
                delayBalanceResult: '2',
                otherMocBalanceResult: '2',
                otherTokenBalanceResult: '1',
                otherDelayBalanceResult: '0',
            },
            {
                description: "alice deposit 2 has 1 reward alice can't withdraw 1",
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '1',
                mocBalanceResult: '3',
                tokenBalanceResult: '2',
                delayBalanceResult: '0',
                otherMocBalanceResult: '0',
                otherTokenBalanceResult: '0',
                otherDelayBalanceResult: '0',
            },
            {
                // TODO: Check the same situation with bob participating.
                description: 'alice deposit 2 has 1 reward alice try to withdraw 2 but gets 1',
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '2',
                mocBalanceResult: '2',
                tokenBalanceResult: '1',
                delayBalanceResult: '1',
                otherMocBalanceResult: '0',
                otherTokenBalanceResult: '0',
                otherDelayBalanceResult: '0',
            },
            {
                description: 'alice deposit 2 has 1 reward alice can withdraw 3',
                amount: '2',
                reward: '1',
                addAmount: '0',
                withdrawAmount: '3',
                mocBalanceResult: '0',
                tokenBalanceResult: '0',
                delayBalanceResult: '3',
                otherMocBalanceResult: '0',
                otherTokenBalanceResult: '0',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    "alice deposit 2 has 1 reward bob deposit 2 and get 1 moc alice can't withdraw 1",
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '1',
                mocBalanceResult: '2',
                tokenBalanceResult: '2',
                delayBalanceResult: '0',
                otherMocBalanceResult: '1',
                otherTokenBalanceResult: '1',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    'alice deposit 2 has 1 reward bob deposit 2 and get 1 token alice can withdraw 2',
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '2',
                mocBalanceResult: '0',
                tokenBalanceResult: '0',
                delayBalanceResult: '2',
                otherMocBalanceResult: '1',
                otherTokenBalanceResult: '1',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    'alice deposit 2 has 1 reward bob deposit 2 and get 1 moc alice try to withdraw 3 but withdraw 2',
                amount: '2',
                reward: '1',
                addAmount: '2',
                withdrawAmount: '3',
                mocBalanceResult: '2',
                tokenBalanceResult: '1',
                delayBalanceResult: '2',
                otherMocBalanceResult: '1',
                otherTokenBalanceResult: '1',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    'alice deposit 2 has 1 reward bob deposit 1 (this gives 1 moc to alice) alice can withdraw 4',
                amount: '2',
                reward: '1',
                addAmount: '1',
                withdrawAmount: '4',
                mocBalanceResult: '0',
                tokenBalanceResult: '0',
                delayBalanceResult: '4',
                otherMocBalanceResult: '0',
                otherTokenBalanceResult: '0',
                otherDelayBalanceResult: '0',
            },
            {
                description:
                    "alice deposit 100 has 10000 reward can't remove 100 MOC must remove multiples of 101==10100/100",
                amount: '100', // Amount deposited to test
                reward: (100 * 100).toString(), // Amount transfered as reward
                addAmount: '0', // Amount deposited by another account
                withdrawAmount: '100', // Amount withdrawn by original account
                mocBalanceResult: '10100', // Moc balance after first withdrawal
                tokenBalanceResult: '100', // Token balance after first withdrawal
                delayBalanceResult: '0', // Delay machine balance after first withdrawal
                otherMocBalanceResult: '0', // Moc balance after other user's deposit
                otherTokenBalanceResult: '0', // Token balance after other user's deposit
                otherDelayBalanceResult: '0', // Delay machine balance after other user's withdrawal
            },
        ];
        for (let i = 0; i < testValues.length; i++) {
            it(testValues[i].description, async () => {
                // Previous approve for deposit in StakingMock
                await this.token.approve(this.staking.address, testValues[i].amount, {
                    from: ALICE,
                });
                console.log('Making deposit of', testValues[i].amount, 'mocs <---------------');
                // Deposit mocs in StakingMock
                await this.staking.deposit(testValues[i].amount, ALICE, {
                    from: ALICE,
                });

                const mocBalanceAfterFirstDeposit = await this.staking.getBalance(ALICE);
                const tokenBalanceAfterFirstDeposit = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                console.log(
                    "Original user's moc balance after first deposit",
                    mocBalanceAfterFirstDeposit.toString(),
                );
                console.log(
                    "Original user's token balance after first deposit",
                    tokenBalanceAfterFirstDeposit.toString(),
                );

                // Check the owner's stake in mocs was deposited
                assert.isTrue(mocBalanceAfterFirstDeposit.eq(new BN(testValues[i].amount)));
                // Check the internal token balance was added.
                assert.isTrue(tokenBalanceAfterFirstDeposit.eq(new BN(testValues[i].amount)));

                // Check Supporters's balance before reward deposit
                const prevSupportersBalance = await this.token.balanceOf(this.supporters.address);
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
                    from: ALICE,
                });

                // Check Supporters's balance after reward deposit
                const afterSupportersBalance = await this.token.balanceOf(this.supporters.address);
                // Check Supporters's balance changed correctly
                assert.isTrue(
                    afterSupportersBalance
                        .sub(prevSupportersBalance)
                        .eq(new BN(testValues[i].reward)),
                );

                // Check delay machine previous token balance to compare later
                const prevDelayBalance = await this.token.balanceOf(this.delayMachine.address);

                await helpers.mineBlocks(period);

                if (testValues[i].addAmount !== '0') {
                    const mocBalanceBeforeOtherDeposit = await this.staking.getBalance(BOB);
                    const tokenBalanceBeforeOtherDeposit = await this.stakingMock.getBalanceInTokens(
                        BOB,
                    );
                    console.log(
                        "Original user's moc balance before another user's deposit",
                        mocBalanceBeforeOtherDeposit.toString(),
                    );
                    console.log(
                        "Original user's token balance before another user's deposit",
                        tokenBalanceBeforeOtherDeposit.toString(),
                    );

                    // Previous approve for deposit in Staking
                    await this.token.approve(this.staking.address, testValues[i].addAmount, {
                        from: BOB,
                    });
                    console.log(
                        "Making another user's deposit of",
                        testValues[i].addAmount,
                        'mocs <---------------',
                    );
                    console.log(
                        '--------------------->',
                        await this.staking.totalMoc(),
                        await this.staking.totalToken(),
                    );
                    // Deposit mocs in Staking
                    await this.staking.deposit(testValues[i].addAmount, BOB, {
                        from: BOB,
                    });
                    console.log(
                        '--------------------->',
                        await this.staking.totalMoc(),
                        await this.staking.totalToken(),
                    );
                    const otherUserMocBalanceAfterDeposit = await this.staking.getBalance(BOB);
                    const otherUserTokenBalanceAfterDeposit = await this.stakingMock.getBalanceInTokens(
                        BOB,
                    );
                    console.log(
                        "Other user's moc balance after deposit",
                        otherUserMocBalanceAfterDeposit.toString(),
                    );
                    console.log(
                        "Other user's token balance after deposit",
                        otherUserTokenBalanceAfterDeposit.toString(),
                    );
                    // Check the other user's stake in mocs was deposited
                    assert.isTrue(
                        otherUserMocBalanceAfterDeposit.eq(
                            new BN(testValues[i].otherMocBalanceResult),
                        ),
                    );
                    // Check the other user's token balance was correctly deposited
                    assert.isTrue(
                        otherUserTokenBalanceAfterDeposit.eq(
                            new BN(testValues[i].otherTokenBalanceResult),
                        ),
                    );
                }

                const mocBalanceBeforeWithdrawal = await this.staking.getBalance(ALICE);
                const tokenBalanceBeforeWithdrawal = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                console.log(
                    "Original user's moc balance before withdrawal",
                    mocBalanceBeforeWithdrawal.toString(),
                );
                console.log(
                    "Original user's token balance before withdrawal",
                    tokenBalanceBeforeWithdrawal.toString(),
                );

                console.log('Making withdrawal of', testValues[i].withdrawAmount, 'mocs');
                // Withdraw an amount of stake taken from the list
                await this.staking.withdraw(testValues[i].withdrawAmount, {
                    from: ALICE,
                });

                // Check delay machine moc balance after withdrawal
                const afterDelayBalance = await this.token.balanceOf(this.delayMachine.address);
                console.log(
                    "Assert the expected Delay Machine's balance change (",
                    testValues[i].delayBalanceResult,
                    ') equals the actual change (',
                    afterDelayBalance.sub(prevDelayBalance).toString(),
                    ')',
                );
                // Assert that delay machine received the amount withdrawn
                assert.isTrue(
                    afterDelayBalance
                        .sub(prevDelayBalance)
                        .eq(new BN(testValues[i].delayBalanceResult)),
                );

                const balanceAfterWithdrawal = await this.staking.getBalance(ALICE);
                // Check moc balance of user after withdrawal
                console.log('balanceAfterWithdrawal', balanceAfterWithdrawal.toString());
                assert.isTrue(balanceAfterWithdrawal.eq(new BN(testValues[i].mocBalanceResult)));

                const tokenBalanceAfterWithdrawal = await this.stakingMock.getBalanceInTokens(
                    ALICE,
                );
                // Check the internal token balance.
                console.log('tokenBalanceAfterWithdrawal', tokenBalanceAfterWithdrawal.toString());
                assert.isTrue(
                    tokenBalanceAfterWithdrawal.eq(new BN(testValues[i].tokenBalanceResult)),
                );

                console.log(
                    'Withdraw the rest of the stake to reset it, which is',
                    balanceAfterWithdrawal.toString(),
                    'mocs',
                );
                // Withdraw the rest of the stake to reset it
                await this.staking.withdraw(balanceAfterWithdrawal, {from: ALICE});
                console.log("Check the owner's moc balance is 0.");
                // Check the owner's moc balance is 0.
                assert.isTrue((await this.staking.getBalance(ALICE)).eq(new BN(0)));
                console.log("Check the owner's internal token balance is 0.");
                // Check the owner's internal token balance is 0.
                assert.isTrue((await this.stakingMock.getBalanceInTokens(ALICE)).eq(new BN(0)));

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
