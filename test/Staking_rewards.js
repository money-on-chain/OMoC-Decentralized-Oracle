const helpers = require('./helpers');
const {BN} = require('@openzeppelin/test-helpers');

contract('Staking_rounding', async (accounts) => {
    const REWARDS = accounts[1];
    const ALICE = accounts[2];
    const BOB = accounts[3];
    const CHARLIE = accounts[4];
    const DAVE = accounts[5];
    const EVE = accounts[6];
    const users = [ALICE, BOB, CHARLIE, DAVE, EVE];

    const minCPSubscriptionStake = (10 ** 18).toString();
    const testCasesValuesStructure = {
        byBlockAmountInPeriods: [
            {
                blocks: 1,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '1',
                                description: '',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, {mocBalance: '1', tokenBalance: '1'}],
                                        withdrawalAmount: '1',
                                        mocBalanceAfterWithdrawal: '1',
                                        tokenBalanceAfterWithdrawal: '1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
    let periodValues;
    let period;
    let byUsersValues;
    let userAmount;
    let testValues;
    for (let g = 0; g < testCasesValuesStructure.byBlockAmountInPeriods.length; g++) {
        describe(
            'Should check reward distribution with period of ' + g.toString() + ' block/s',
            async () => {
                periodValues = testCasesValuesStructure.byBlockAmountInPeriods[g];
                period = periodValues.blocks;
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
                    await this.governor.mint(this.token.address, CHARLIE, '800000000000000000000');
                    await this.governor.mint(this.token.address, DAVE, '800000000000000000000');
                    await this.governor.mint(this.token.address, EVE, '800000000000000000000');
                });
                for (let h = 0; h < periodValues.byUserAmount.length; h++) {
                    byUsersValues = periodValues.byUserAmount[h];
                    userAmount = byUsersValues.userAmount;
                    describe(
                        'Should check reward distribution with ' +
                            userAmount.toString() +
                            ' user/s',
                        async () => {
                            for (let i = 0; i < byUsersValues.cases.length; i++) {
                                testValues = byUsersValues.cases[i];
                                it(
                                    testValues.testNumber + ': ' + testValues.description,
                                    async () => {
                                        console.log('Test number:', testValues.testNumber);

                                        //////////////////////////////////////////
                                        /////       DEPOSIT IN STAKING       /////
                                        //////////////////////////////////////////

                                        let mocBalanceAfterFirstDeposit;
                                        let tokenBalanceAfterFirstDeposit;
                                        for (
                                            let userIndex1 = 0;
                                            userIndex1 < testValues.users.length;
                                            userIndex1++
                                        ) {
                                            // Previous approve for deposit in Staking
                                            await this.token.approve(
                                                this.staking.address,
                                                testValues.users[userIndex1].depositAmount,
                                                {
                                                    from: users[userIndex1],
                                                },
                                            );
                                            console.log(
                                                'Making deposit of',
                                                testValues.users[userIndex1].depositAmount,
                                                'mocs by ' +
                                                    testValues.users[userIndex1].name +
                                                    '<---------------',
                                            );
                                            // Deposit mocs in Staking
                                            await this.staking.deposit(
                                                testValues.users[userIndex1].depositAmount,
                                                users[userIndex1],
                                                {
                                                    from: users[userIndex1],
                                                },
                                            );

                                            mocBalanceAfterFirstDeposit = await this.staking.getBalance(
                                                users[userIndex1],
                                            );
                                            tokenBalanceAfterFirstDeposit = await this.stakingMock.getBalanceInTokens(
                                                users[userIndex1],
                                            );
                                            console.log(
                                                testValues.users[userIndex1].name +
                                                    "'s moc balance after first deposit",
                                                mocBalanceAfterFirstDeposit.toString(),
                                                'Expected:',
                                                testValues.users[userIndex1].mocBalanceAfterDeposit,
                                            );
                                            console.log(
                                                testValues.users[userIndex1].name +
                                                    "'s internal token balance after first deposit",
                                                tokenBalanceAfterFirstDeposit.toString(),
                                                'Expected:',
                                                testValues.users[userIndex1]
                                                    .tokenBalanceAfterDeposit,
                                            );
                                            // Check stake in mocs was deposited
                                            assert.isTrue(
                                                mocBalanceAfterFirstDeposit.eq(
                                                    new BN(
                                                        testValues.users[
                                                            userIndex1
                                                        ].mocBalanceAfterDeposit,
                                                    ),
                                                ),
                                            );
                                            // Check internal token balance was updated.
                                            assert.isTrue(
                                                tokenBalanceAfterFirstDeposit.eq(
                                                    new BN(
                                                        testValues.users[
                                                            userIndex1
                                                        ].tokenBalanceAfterDeposit,
                                                    ),
                                                ),
                                            );
                                        }

                                        //////////////////////////////////////////
                                        ///// TRANSFER REWARDS TO SUPPORTERS /////
                                        //////////////////////////////////////////

                                        // Check Supporters's balance before reward deposit
                                        const supportersBalanceBeforeTransfer = await this.token.balanceOf(
                                            this.supporters.address,
                                        );
                                        console.log(
                                            'Transfering',
                                            testValues.reward,
                                            'mocs to Supporters <---------------',
                                        );
                                        // Transfer rewards to Supporters contract to increase moc balance in it
                                        await this.token.transfer(
                                            this.supporters.address,
                                            testValues.reward,
                                            {
                                                from: REWARDS,
                                            },
                                        );
                                        console.log(
                                            'Calling distribute() in Supporters <---------------',
                                        );
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
                                                .eq(new BN(testValues.reward)),
                                        );

                                        let mocBalanceAfterReward;
                                        let tokenBalanceAfterReward;
                                        for (
                                            let userIndex2 = 0;
                                            userIndex2 < testValues.users.length;
                                            userIndex2++
                                        ) {
                                            mocBalanceAfterReward = await this.staking.getBalance(
                                                users[userIndex2],
                                            );
                                            tokenBalanceAfterReward = await this.stakingMock.getBalanceInTokens(
                                                users[userIndex2],
                                            );
                                            console.log(
                                                testValues.users[userIndex2].name +
                                                    "'s moc balance after reward transfer",
                                                mocBalanceAfterReward.toString(),
                                                'Expected:',
                                                testValues.users[userIndex2].mocBalanceAfterReward,
                                            );
                                            console.log(
                                                testValues.users[userIndex2].name +
                                                    "'s internal token balance after reward transfer",
                                                tokenBalanceAfterReward.toString(),
                                                'Expected:',
                                                testValues.users[userIndex2]
                                                    .tokenBalanceAfterReward,
                                            );
                                            // Check stake in mocs after reward transfer
                                            assert.isTrue(
                                                mocBalanceAfterReward.eq(
                                                    new BN(
                                                        testValues.users[
                                                            userIndex2
                                                        ].mocBalanceAfterReward,
                                                    ),
                                                ),
                                            );
                                            // Check internal token balance after reward transfer
                                            assert.isTrue(
                                                tokenBalanceAfterReward.eq(
                                                    new BN(
                                                        testValues.users[
                                                            userIndex2
                                                        ].tokenBalanceAfterReward,
                                                    ),
                                                ),
                                            );
                                        }
                                        //////////////////////////////////////////
                                        /////   GO THROUGH EARNINGS PERIOD   /////
                                        //////////////////////////////////////////

                                        let mocBalance;
                                        let tokenBalance;
                                        for (let j = 1; j <= period; j++) {
                                            for (let k = 0; k < testValues.users.length; k++) {
                                                mocBalance = await this.staking.getBalance(
                                                    users[k],
                                                );
                                                tokenBalance = await this.stakingMock.getBalanceInTokens(
                                                    users[k],
                                                );
                                                console.log(
                                                    testValues.users[k].name +
                                                        "'s moc balance after " +
                                                        j.toString() +
                                                        ' period blocks',
                                                    mocBalance.toString(),
                                                    'Expected:',
                                                    testValues.users[k].periodValues[j].mocBalance,
                                                );
                                                console.log(
                                                    testValues.users[k].name +
                                                        "'s internal token balance after " +
                                                        j.toString() +
                                                        ' period blocks',
                                                    tokenBalance.toString(),
                                                    'Expected:',
                                                    testValues.users[k].periodValues[j]
                                                        .tokenBalance,
                                                );
                                                // Check user's stake in mocs
                                                assert.isTrue(
                                                    mocBalance.eq(
                                                        new BN(
                                                            testValues.users[k].periodValues[
                                                                j
                                                            ].mocBalance,
                                                        ),
                                                    ),
                                                );
                                                // Check user's internal token balance
                                                assert.isTrue(
                                                    tokenBalance.eq(
                                                        new BN(
                                                            testValues.users[k].periodValues[
                                                                j
                                                            ].tokenBalance,
                                                        ),
                                                    ),
                                                );
                                            }
                                            await helpers.mineBlocks(1);
                                        }
                                    },
                                );
                            }
                        },
                    );
                }
            },
        );
    }
});
