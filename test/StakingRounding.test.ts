import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import {
    ContractOf,
    Deployer,
    type NetworkHelpers,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';
// Replace by console.log to enable logging.
const log = (..._rest: any[]) => {};

describe('StakingRounding', function () {
    let accounts: WalletClients;
    let networkHelpers: NetworkHelpers;
    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let REWARDS: WalletClient;
    let ALICE: WalletClient;
    let BOB: WalletClient;
    let contracts: Awaited<ReturnType<typeof initContracts>>;

    const minCPSubscriptionStake = (10 ** 18).toString();
    const period = 3;

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        REWARDS = accounts[1];
        ALICE = accounts[2];
        BOB = accounts[4];

        contracts = await initContracts(
            deployer,
            accounts[8],
            BigInt(period),
            BigInt(minCPSubscriptionStake),
        );
        const { governor, token } = contracts;
        await governor.mint(token.address, REWARDS.account!.address, 800n * 10n ** 18n);
        await governor.mint(token.address, ALICE.account!.address, 800n * 10n ** 18n);
        await governor.mint(token.address, BOB.account!.address, 800n * 10n ** 18n);
    });

    async function testIt(
        testValue: any,
        token: ContractOf<'GovernedERC20'>,
        staking: ContractOf<'Staking'>,
        stakingMock: ContractOf<'StakingMock'>,
        supporters: ContractOf<'Supporters'>,
        delayMachine: ContractOf<'DelayMachine'>,
    ) {
        log('Test number:', testValue.testNumber);
        // Previous approve for deposit in Staking
        await token.write.approve([staking.address, testValue.amount], {
            account: ALICE.account!,
        });
        log('Making deposit of', testValue.amount, 'mocs by ALICE<---------------');
        // Deposit mocs in Staking
        await staking.write.deposit([testValue.amount, ALICE.account!.address], {
            account: ALICE.account!,
        });

        const mocBalanceAfterFirstDeposit = await staking.read.getBalance([ALICE.account!.address]);
        const tokenBalanceAfterFirstDeposit = await stakingMock.read.getBalanceInTokens([
            ALICE.account!.address,
        ]);
        log("ALICE's moc balance after first deposit", mocBalanceAfterFirstDeposit.toString());
        log("ALICE's token balance after first deposit", tokenBalanceAfterFirstDeposit.toString());

        // Check the owner's stake in mocs was deposited
        expect(mocBalanceAfterFirstDeposit.toString(), 'mocBalanceAfterFirstDeposit').to.be.equal(
            testValue.amount,
        );
        // Check the internal token balance was added.
        expect(
            tokenBalanceAfterFirstDeposit.toString(),
            'tokenBalanceAfterFirstDeposit',
        ).to.be.equal(testValue.amount);

        // Check Supporters's balance before reward deposit
        const supportersBalanceBeforeTransfer = await token.read.balanceOf([supporters.address]);
        log('Transfering', testValue.reward, 'mocs to Supporters <---------------');
        // Transfer rewards to Supporters contract to increase moc balance in it
        await token.write.transfer([supporters.address, testValue.reward], {
            account: REWARDS.account!,
        });
        log('Calling distribute() in Supporters <---------------');
        // Call distribute to update Supporters' total moc balance
        await supporters.write.distribute({
            account: REWARDS.account!,
        });

        // Check Supporters's balance after reward deposit
        const supportersBalanceAfterTransfer = await token.read.balanceOf([supporters.address]);
        // Check Supporters's balance changed correctly
        expect(
            (supportersBalanceAfterTransfer - supportersBalanceBeforeTransfer).toString(),
            'supportersBalanceAfterTransfer.sub(supportersBalanceBeforeTransfer)',
        ).to.be.equal(testValue.reward);

        // Check delay machine previous token balance to compare later
        const delayMocBalanceBeforeWithdrawal = await token.read.balanceOf([delayMachine.address]);

        await networkHelpers.mine(period);

        if (testValue.addAmount !== '0') {
            const mocBalanceBeforeOtherDeposit = await staking.read.getBalance([
                ALICE.account!.address,
            ]);
            const tokenBalanceBeforeOtherDeposit = await stakingMock.read.getBalanceInTokens([
                ALICE.account!.address,
            ]);
            const otherUserMocBalanceBeforeOtherDeposit = await staking.read.getBalance([
                BOB.account!.address,
            ]);
            const otherUserTokenBalanceBeforeOtherDeposit =
                await stakingMock.read.getBalanceInTokens([BOB.account!.address]);
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
            await token.write.approve([staking.address, testValue.addAmount], {
                account: BOB.account!,
            });
            log(
                "Total mocs before BOB's deposit:",
                (await staking.read.totalMoc()).toString(),
                '//',
                "Total tokens before BOB's deposit:",
                (await staking.read.totalToken()).toString(),
            );
            log("Making BOB's deposit of", testValue.addAmount, 'mocs <---------------');
            // Deposit mocs in Staking
            await staking.write.deposit([testValue.addAmount, BOB.account!.address], {
                account: BOB.account!,
            });
            log(
                "Total mocs after BOB's deposit:",
                (await staking.read.totalMoc()).toString(),
                '//',
                "Total tokens after BOB's deposit:",
                (await staking.read.totalToken()).toString(),
            );
            const otherUserMocBalanceAfterSecondDeposit = await staking.read.getBalance([
                BOB.account!.address,
            ]);
            const otherUserTokenBalanceAfterSecondDeposit =
                await stakingMock.read.getBalanceInTokens([BOB.account!.address]);
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
                otherUserMocBalanceAfterSecondDeposit.toString(),
                'otherUserMocBalanceAfterSecondDeposit',
            ).to.be.equal(testValue.otherUserMocBalanceAfterSecondDeposit);
            // Check the other user's token balance was correctly deposited
            expect(
                otherUserTokenBalanceAfterSecondDeposit.toString(),
                'otherUserTokenBalanceAfterSecondDeposit',
            ).to.be.equal(testValue.otherUserTokenBalanceAfterSecondDeposit);
        }

        const mocBalanceBeforeWithdrawal = await staking.read.getBalance([ALICE.account!.address]);
        const tokenBalanceBeforeWithdrawal = await stakingMock.read.getBalanceInTokens([
            ALICE.account!.address,
        ]);
        log("ALICE's moc balance before withdrawal", mocBalanceBeforeWithdrawal.toString());
        log("ALICE's token balance before withdrawal", tokenBalanceBeforeWithdrawal.toString());

        log('Making withdrawal of', testValue.withdrawAmount, 'mocs by ALICE');
        // Withdraw an amount of stake taken from the list
        await staking.write.withdraw([testValue.withdrawAmount], {
            account: ALICE.account!,
        });

        // Check delay machine moc balance after withdrawal
        const delayMocBalanceAfterWithdrawal = await token.read.balanceOf([delayMachine.address]);
        const delayMocBalanceChangeAfterWithdrawal =
            delayMocBalanceAfterWithdrawal - delayMocBalanceBeforeWithdrawal;
        log(
            "Delay Machine's moc balance change after withdrawal:",
            delayMocBalanceChangeAfterWithdrawal.toString(),
            'Expected:',
            testValue.delayMocBalanceChangeAfterWithdrawal,
        );
        // Assert that delay machine received the amount withdrawn
        expect(
            delayMocBalanceChangeAfterWithdrawal.toString(),
            'delayMocBalanceChangeAfterWithdrawal',
        ).to.be.equal(testValue.delayMocBalanceChangeAfterWithdrawal);

        const mocBalanceAfterWithdrawal = await staking.read.getBalance([ALICE.account!.address]);
        const tokenBalanceAfterWithdrawal = await stakingMock.read.getBalanceInTokens([
            ALICE.account!.address,
        ]);
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
        expect(mocBalanceAfterWithdrawal.toString(), 'mocBalanceAfterWithdrawal').to.be.equal(
            testValue.mocBalanceAfterWithdrawal,
        );

        // Check the internal token balance.
        expect(tokenBalanceAfterWithdrawal.toString(), 'tokenBalanceAfterWithdrawal').to.be.equal(
            testValue.tokenBalanceAfterWithdrawal,
        );

        log(
            'ALICE withdraws the rest of the stake to reset it, which is',
            mocBalanceAfterWithdrawal.toString(),
            'mocs',
        );
        // Withdraw the rest of the stake to reset it
        await staking.write.withdraw([mocBalanceAfterWithdrawal], { account: ALICE.account! });
        const mocBalanceAfterReset = await staking.read.getBalance([ALICE.account!.address]);
        const tokenBalanceAfterReset = await stakingMock.read.getBalanceInTokens([
            ALICE.account!.address,
        ]);
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
        expect(mocBalanceAfterReset.toString(), 'mocBalanceAfterReset').to.be.equal(
            testValue.mocBalanceAfterReset,
        );
        // Check the owner's internal token balance is 0.
        expect(tokenBalanceAfterReset.toString(), 'tokenBalanceAfterReset').to.be.equal(
            testValue.tokenBalanceAfterReset,
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
                    contracts.token,
                    contracts.staking,
                    contracts.stakingMock,
                    contracts.supporters,
                    contracts.delayMachine,
                );
            });
        }
        it('alice deposits 100, has 10000 reward, bob deposit 150 and gets 1 token, alice withdraw 150 MOC and gets 1 token == 101', async () => {
            const { token, staking, stakingMock, supporters, delayMachine } = contracts;
            const bobBalanceBefore = await token.read.balanceOf([BOB.account!.address]);
            const bobApprovalBefore = await token.read.allowance([
                BOB.account!.address,
                staking.address,
            ]);
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
                token,
                staking,
                stakingMock,
                supporters,
                delayMachine,
            );
            const bobBalanceAfter = await token.read.balanceOf([BOB.account!.address]);
            const bobApprovalAfter = await token.read.allowance([
                BOB.account!.address,
                staking.address,
            ]);
            expect(
                Number(bobBalanceBefore - bobBalanceAfter),
                "We only take what's needed from bob",
            ).to.be.equal(101);
            expect(
                Number(bobApprovalAfter - bobApprovalBefore),
                'We leave the rest untouched',
            ).to.be.equal(49);
        });
    });
});
