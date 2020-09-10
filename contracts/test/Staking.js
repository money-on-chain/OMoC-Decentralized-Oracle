const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');

contract('Staking', async (accounts) => {
    const minCPSubscriptionStake = (10 ** 18).toString();
    const period = 3;
    const secsUntilStakeRelease = 45;
    let untilTimestampLock;

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: accounts[8],
            period,
            minSubscriptionStake: minCPSubscriptionStake,
        });
        Object.assign(this, contracts);

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[8], '800000000000000000000');
    });

    const oracleData = [
        {
            name: 'oracle-a.io',
            stake: (4 * 10 ** 18).toString(),
            account: accounts[1],
            owner: accounts[2],
        },
        {
            name: 'oracle-b.io',
            stake: (8 * 10 ** 18).toString(),
            account: accounts[3],
            owner: accounts[4],
        },
        {
            name: 'oracle-c.io',
            stake: (1 * 10 ** 18).toString(),
            account: accounts[5],
            owner: accounts[6],
        },
        {
            name: 'oracle-d.io',
            stake: (3 * 10 ** 18).toString(),
            account: accounts[7],
            owner: accounts[8],
        },
    ];

    it('Should check several cases where an oracle might loose mocs when making deposits or withdrawals', async () => {
        const testValues = [
            {
                amount: (1).toString(), // Amount deposited to test
                reward: (1).toString(), // Amount transfered as reward
                addAmount: (0).toString(), // Amount deposited by another account
                withdrawAmount: (1).toString(), // Amount withdrawn by original account
                mocBalanceResult: (2).toString(), // Moc balance after first withdrawal
                tokenBalanceResult: (1).toString(), // Token balance after first withdrawal
                delayBalanceResult: (0).toString(), // Delay machine balance after first withdrawal
                otherMocBalanceResult: (2).toString(), // Moc balance after other user's deposit
                otherTokenBalanceResult: (1).toString(), // Token balance after other user's deposit
                otherDelayBalanceResult: (2).toString(), // Delay machine balance after other user's withdrawal
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (1).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (3).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (3).toString(),
                tokenBalanceResult: (2).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (1).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (0).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (3).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (1).toString(),
                mocBalanceResult: (4).toString(),
                tokenBalanceResult: (2).toString(),
                delayBalanceResult: (0).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (2).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (3).toString(),
                mocBalanceResult: (2).toString(),
                tokenBalanceResult: (1).toString(),
                delayBalanceResult: (2).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
            {
                amount: (2).toString(),
                reward: (1).toString(),
                addAmount: (1).toString(),
                withdrawAmount: (4).toString(),
                mocBalanceResult: (0).toString(),
                tokenBalanceResult: (0).toString(),
                delayBalanceResult: (4).toString(),
                otherMocBalanceResult: (2).toString(),
                otherTokenBalanceResult: (1).toString(),
                otherDelayBalanceResult: (2).toString(),
            },
        ];
        for (let i = 0; i < testValues.length; i++) {
            // Previous approve for deposit in StakingMock
            await this.token.approve(this.stakingMock.address, testValues[i].amount, {
                from: oracleData[2].owner,
            });
            console.log('Making deposit of', testValues[i].amount, 'mocs <---------------');
            // Deposit mocs in StakingMock
            await this.stakingMock.deposit(testValues[i].amount, this.stakingMock.address, {
                from: oracleData[2].owner,
            });

            const mocBalanceAfterFirstDeposit = await this.stakingMock.getBalance();
            const tokenBalanceAfterFirstDeposit = await this.stakingMock.getBalanceInTokens();
            console.log(
                "Original user's moc balance after first deposit",
                mocBalanceAfterFirstDeposit.toString(),
            );
            console.log(
                "Original user's token balance after first deposit",
                tokenBalanceAfterFirstDeposit.toString(),
            );

            // Check the owner's stake in mocs was deposited
            assert.isTrue((await this.stakingMock.getBalance()).eq(new BN(testValues[i].amount)));
            // Check the internal token balance was added.
            assert.isTrue(
                (await this.stakingMock.getBalanceInTokens()).eq(new BN(testValues[i].amount)),
            );

            // Check Supporters's balance before reward deposit
            const prevSupportersBalance = await this.token.balanceOf(this.supporters.address);
            console.log('Transfering', testValues[i].reward, 'mocs to Supporters <---------------');
            // Transfer rewards to Supporters contract to increase moc balance in it
            await this.token.transfer(this.supporters.address, testValues[i].reward);
            console.log('Calling distribute() in Supporters <---------------');
            // Call distribute to update Supporters' total moc balance
            await this.supporters.distribute({
                from: oracleData[2].owner,
            });

            // Check Supporters's balance after reward deposit
            const afterSupportersBalance = await this.token.balanceOf(this.supporters.address);
            // Check Supporters's balance changed correctly
            assert.isTrue(
                afterSupportersBalance.sub(prevSupportersBalance).eq(new BN(testValues[i].reward)),
            );

            // Check delay machine previous token balance to compare later
            const prevDelayBalance = await this.token.balanceOf(this.delayMachine.address);

            await helpers.mineBlocks(period);

            if (testValues[i].addAmount != '0') {
                const mocBalanceBeforeOtherDeposit = await this.stakingMock.getBalance();
                const tokenBalanceBeforeOtherDeposit = await this.stakingMock.getBalanceInTokens();
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
                    from: oracleData[1].owner,
                });
                console.log(
                    "Making another user's deposit of",
                    testValues[i].addAmount,
                    'mocs <---------------',
                );
                // Deposit mocs in Staking
                await this.staking.deposit(testValues[i].addAmount, oracleData[1].owner, {
                    from: oracleData[1].owner,
                });

                const otherUserMocBalanceAfterDeposit = await this.staking.getBalance(
                    oracleData[1].owner,
                    {
                        from: oracleData[1].owner,
                    },
                );
                //const otherUserTokenBalanceAfterDeposit = await this.staking.getBalanceInTokens();
                console.log(
                    "Other user's moc balance after deposit",
                    otherUserMocBalanceAfterDeposit.toString(),
                );
                //console.log('Other user\'s token balance after deposit', otherUserTokenBalanceAfterDeposit.toString());
            }

            const mocBalanceBeforeWithdrawal = await this.stakingMock.getBalance();
            const tokenBalanceBeforeWithdrawal = await this.stakingMock.getBalanceInTokens();
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
            await this.stakingMock.withdraw(testValues[i].withdrawAmount, {
                from: oracleData[2].owner,
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

            const balanceAfterWithdrawal = await this.stakingMock.getBalance();
            // Check moc balance of user after withdrawal
            console.log('balanceAfterWithdrawal', balanceAfterWithdrawal.toString());
            assert.isTrue(balanceAfterWithdrawal.eq(new BN(testValues[i].mocBalanceResult)));

            const tokenBalanceAfterWithdrawal = await this.stakingMock.getBalanceInTokens();
            // Check the internal token balance.
            console.log('tokenBalanceAfterWithdrawal', tokenBalanceAfterWithdrawal.toString());
            assert.isTrue(tokenBalanceAfterWithdrawal.eq(new BN(testValues[i].tokenBalanceResult)));

            console.log(
                'Withdraw the rest of the stake to reset it, which is',
                balanceAfterWithdrawal.toString(),
                'mocs',
            );
            // Withdraw the rest of the stake to reset it
            await this.stakingMock.withdraw(balanceAfterWithdrawal, {from: oracleData[2].owner});
            console.log("Check the owner's moc balance is 0.");
            // Check the owner's moc balance is 0.
            assert.isTrue((await this.stakingMock.getBalance()).eq(new BN(0)));
            console.log("Check the owner's internal token balance is 0.");
            // Check the owner's internal token balance is 0.
            assert.isTrue((await this.stakingMock.getBalanceInTokens()).eq(new BN(0)));

            /*console.log('Making other user\'s withdrawal of', testValues[i].withdrawAmount, 'mocs');
            // Withdraw an amount of stake taken from the list
            await this.staking.withdraw(testValues[i].withdrawAmount, {from: oracleData[1].owner});*/

            console.log('///////////////////////////////////////////////////////////');
        }
    });

    it('Should register Oracles A, B, C', async () => {
        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
            from: oracleData[2].owner,
        });

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner);
        assert.equal(info0.internetName, oracleData[0].name);
        assert.equal(info0.stake, 0);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].owner);
        assert.equal(info1.internetName, oracleData[1].name);
        assert.equal(info1.stake, 0);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].owner);
        assert.equal(info2.internetName, oracleData[2].name);
        assert.equal(info2.stake, 0);
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[0].owner));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[1].owner));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[2].owner));
    });

    it('Should deposit stake for Oracle A, B', async () => {
        const prevBalance0 = await this.token.balanceOf(oracleData[0].owner);
        const prevBalance1 = await this.token.balanceOf(oracleData[1].owner);

        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });

        assert.isTrue(
            (await this.token.balanceOf(oracleData[0].owner)).eq(
                prevBalance0.sub(new BN(oracleData[0].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[1].owner)).eq(
                prevBalance1.sub(new BN(oracleData[1].stake)),
            ),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[0].owner)).eq(new BN(oracleData[0].stake)),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[1].owner)).eq(new BN(oracleData[1].stake)),
        );
    });

    it('Should subscribe Oracles A, B, C to coin pair BTCUSD', async () => {
        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[0].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[0].owner));

        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[1].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[1].owner));

        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[2].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[2].owner));
    });

    it("Should not be able to lock mocs from an address other than the voting machine's", async () => {
        untilTimestampLock = Math.round(Date.now() / 1000) + secsUntilStakeRelease;
        await expectRevert(
            this.staking.lockMocs(oracleData[1].owner, new BN(untilTimestampLock), {
                from: oracleData[1].owner,
            }),
            'Address is not whitelisted',
        );
    });

    it('Should lock stake of oracle B', async () => {
        untilTimestampLock = Math.round(Date.now() / 1000) + secsUntilStakeRelease;
        await this.votingMachine.lockMocs(oracleData[1].owner, new BN(untilTimestampLock), {
            from: oracleData[1].owner,
        });
    });

    // Slow test. Comment to test the others faster.
    it('Should not be able to withdraw stake of oracle B until it is unlocked', async () => {
        let currentTimestamp = await time.latest();
        while (currentTimestamp < untilTimestampLock) {
            await expectRevert(
                this.staking.withdraw(oracleData[1].stake, {from: oracleData[1].owner}),
                'Stake not available for withdrawal.',
            );
            await helpers.mineBlocks(1);
            currentTimestamp = await time.latest();
        }
        await this.staking.withdraw(oracleData[1].stake, {from: oracleData[1].owner});
    });

    it('Should not be able to withdraw stake of oracle D because it has none', async () => {
        await expectRevert(
            this.staking.withdraw(oracleData[3].stake, {from: oracleData[3].owner}),
            'Stake not available for withdrawal.',
        );
    });

    it('Should withdraw stake of oracle A', async () => {
        await this.staking.withdraw(oracleData[0].stake, {from: oracleData[0].owner});
    });

    it('Should withdraw stake of oracle D w/o leaving tokens stuck in contract', async () => {
        const withdrawAmounts = [
            (parseInt(oracleData[3].stake, 10) / 2).toString(),
            (parseInt(oracleData[3].stake, 10) / 3).toString(),
            (parseInt(oracleData[3].stake, 10) / 4).toString(),
            (parseInt(oracleData[3].stake, 10) / 5).toString(),
            (parseInt(oracleData[3].stake, 10) - 1).toString(),
            (parseInt(oracleData[3].stake, 10) - 11).toString(),
            (parseInt(oracleData[3].stake, 10) - 111).toString(),
            (parseInt(oracleData[3].stake, 10) - 1111).toString(),
        ];
        for (let i = 0; i < withdrawAmounts.length; i++) {
            // Previous approve for deposit in StakingMock
            await this.token.approve(this.stakingMock.address, oracleData[3].stake, {
                from: oracleData[3].owner,
            });
            // Deposit mocs in StakingMock
            await this.stakingMock.deposit(oracleData[3].stake, this.stakingMock.address, {
                from: oracleData[3].owner,
            });
            // Check the owner's stake in mocs was deposited
            assert.isTrue((await this.stakingMock.getBalance()).eq(new BN(oracleData[3].stake)));
            // Withdraw an amount of stake taken from the list
            await this.stakingMock.withdraw(withdrawAmounts[i], {from: oracleData[3].owner});
            // Check the owner's stake balance in mocs was reduced accordingly
            const balanceAfterWithdraw = new BN(oracleData[3].stake).sub(
                new BN(withdrawAmounts[i]),
            );
            assert.isTrue((await this.stakingMock.getBalance()).eq(balanceAfterWithdraw));
            // Withdraw the rest of the stake to reset it
            await this.stakingMock.withdraw(balanceAfterWithdraw, {from: oracleData[3].owner});
            // Check the owner's moc and internal token balances are 0.
            assert.isTrue((await this.stakingMock.getBalance()).eq(new BN(0)));
            assert.isTrue((await this.stakingMock.getBalanceInTokens()).eq(new BN(0)));
        }
    });
});
