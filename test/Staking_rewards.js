const helpers = require('./helpers');
const {BN} = require('@openzeppelin/test-helpers');
const log = () => {};
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
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
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
                                    },
                                ],
                            },
                            {
                                testNumber: '2',
                                description:
                                    'Alice deposits 2 moc, has 1 reward, moc balance after is 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '3',
                                description:
                                    'Alice deposits 3 moc, has 1 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '4',
                                description:
                                    'Alice deposits 1 moc, has 2 reward, moc balance after is 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, {mocBalance: '1', tokenBalance: '1'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '5',
                                description:
                                    'Alice deposits 2 moc, has 2 reward, moc balance after is 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '6',
                                description:
                                    'Alice deposits 3 moc, has 2 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        userAmount: 2,
                        cases: [
                            {
                                testNumber: '7',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 1 reward, Alice moc balance after is 1, Bob 1',
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
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, {mocBalance: '1', tokenBalance: '1'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '8',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 1 reward, Alice moc balance after is 2, Bob 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '9',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 1 reward, Alice moc balance after is 3, Bob 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '10',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 2 reward, Alice moc balance after is 1, Bob 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, {mocBalance: '1', tokenBalance: '1'}],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, {mocBalance: '1', tokenBalance: '1'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '11',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 2 reward, Alice moc balance after is 2, Bob 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, {mocBalance: '2', tokenBalance: '2'}],
                                    },
                                ],
                            },
                            {
                                testNumber: '12',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 2 reward, Alice moc balance after is 3, Bob 3',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, {mocBalance: '3', tokenBalance: '3'}],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 2,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '13',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '14',
                                description:
                                    'Alice deposits 2 moc, has 1 reward, moc balance after is 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '15',
                                description:
                                    'Alice deposits 3 moc, has 1 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '16',
                                description:
                                    'Alice deposits 1 moc, has 2 reward, moc balance after is 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '17',
                                description:
                                    'Alice deposits 2 moc, has 2 reward, moc balance after is 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '18',
                                description:
                                    'Alice deposits 3 moc, has 2 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        userAmount: 2,
                        cases: [
                            {
                                testNumber: '19',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 1 reward, Alice moc balance after is 1, Bob 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '20',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 1 reward, Alice moc balance after is 2, Bob 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '21',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 1 reward, Alice moc balance after is 3, Bob 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '22',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 2 reward, Alice moc balance after is 1, Bob 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '23',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 2 reward, Alice moc balance after is 2, Bob 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '24',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 2 reward, Alice moc balance after is 3, Bob 3',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 3,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '25',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 4,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '26',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 5,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '27',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 6,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '28',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 7,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '29',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                blocks: 8,
                byUserAmount: [
                    {
                        userAmount: 1,
                        cases: [
                            {
                                testNumber: '30',
                                description:
                                    'Alice deposits 1 moc, has 1 reward, moc balance after is 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '31',
                                description:
                                    'Alice deposits 2 moc, has 1 reward, moc balance after is 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '32',
                                description:
                                    'Alice deposits 3 moc, has 1 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '33',
                                description:
                                    'Alice deposits 1 moc, has 2 reward, moc balance after is 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '34',
                                description:
                                    'Alice deposits 2 moc, has 2 reward, moc balance after is 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '35',
                                description:
                                    'Alice deposits 3 moc, has 2 reward, moc balance after is 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        userAmount: 2,
                        cases: [
                            {
                                testNumber: '36',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 1 reward, Alice moc balance after is 1, Bob 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '37',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 1 reward, Alice moc balance after is 2, Bob 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '38',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 1 reward, Alice moc balance after is 3, Bob 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '39',
                                description:
                                    'Alice deposits 1 moc, Bob 1, has 2 reward, Alice moc balance after is 1, Bob 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '40',
                                description:
                                    'Alice deposits 2 moc, Bob 2, has 2 reward, Alice moc balance after is 2, Bob 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '41',
                                description:
                                    'Alice deposits 3 moc, Bob 3, has 2 reward, Alice moc balance after is 3, Bob 3',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        userAmount: 3,
                        cases: [
                            {
                                testNumber: '42',
                                description:
                                    'Alice deposits 1 moc, Bob 1, Charlie 1, has 1 reward, Alice moc balance after is 1, Bob 1, Charlie 1',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '43',
                                description:
                                    'Alice deposits 2 moc, Bob 2, Charlie 2, has 1 reward, Alice moc balance after is 2, Bob 2, Charlie 2',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '44',
                                description:
                                    'Alice deposits 3 moc, Bob 3, Charlie 3, has 1 reward, Alice moc balance after is 3, Bob 3, Charlie 3',
                                reward: '1',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '45',
                                description:
                                    'Alice deposits 1 moc, Bob 1, Charlie 1, has 2 reward, Alice moc balance after is 1, Bob 1, Charlie 1',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '46',
                                description:
                                    'Alice deposits 2 moc, Bob 2, Charlie 2, has 2 reward, Alice moc balance after is 2, Bob 2, Charlie 2',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '47',
                                description:
                                    'Alice deposits 3 moc, Bob 3, Charlie 3, has 2 reward, Alice moc balance after is 3, Bob 3, Charlie 3',
                                reward: '2',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '48',
                                description:
                                    'Alice deposits 1 moc, Bob 1, Charlie 1, has 4 reward, Alice moc balance after is 1, Bob 1, Charlie 1',
                                reward: '4',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [
                                            {},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '1', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                            {mocBalance: '2', tokenBalance: '1'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '49',
                                description:
                                    'Alice deposits 2 moc, Bob 2, Charlie 2, has 4 reward, Alice moc balance after is 2, Bob 2, Charlie 2',
                                reward: '4',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [
                                            {},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '2', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                            {mocBalance: '3', tokenBalance: '2'},
                                        ],
                                    },
                                ],
                            },
                            {
                                testNumber: '50',
                                description:
                                    'Alice deposits 3 moc, Bob 3, Charlie 3, has 4 reward, Alice moc balance after is 3, Bob 3, Charlie 3',
                                reward: '4',
                                users: [
                                    {
                                        name: 'ALICE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                        ],
                                    },
                                    {
                                        name: 'CHARLIE',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [
                                            {},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '3', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                            {mocBalance: '4', tokenBalance: '3'},
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    describe('Should check reward distribution in cases with a period of 1 block', async () => {
        const contractSet = {};
        const periodValues = testCasesValuesStructure.byBlockAmountInPeriods[0];
        const period = periodValues.blocks;
        log('PERIOD', period);
        beforeEach(async () => {
            const contracts = await helpers.initContracts({
                governorOwner: accounts[8],
                period,
                minSubscriptionStake: minCPSubscriptionStake,
            });
            Object.assign(this, contracts);
            Object.assign(contractSet, contracts);
            await this.governor.mint(this.token.address, REWARDS, '800000000000000000000');
            await this.governor.mint(this.token.address, ALICE, '800000000000000000000');
            await this.governor.mint(this.token.address, BOB, '800000000000000000000');
            await this.governor.mint(this.token.address, CHARLIE, '800000000000000000000');
            await this.governor.mint(this.token.address, DAVE, '800000000000000000000');
            await this.governor.mint(this.token.address, EVE, '800000000000000000000');
        });

        // Tests with 1 user
        it(
            periodValues.byUserAmount[0].cases[0].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[0].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[0],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[1].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[1].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[1],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[2].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[2].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[2],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[3].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[3].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[3],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[4].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[4].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[4],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[5].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[5].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[5],
                    period,
                    contractSet,
                );
            },
        );

        // Tests with 2 users
        it(
            periodValues.byUserAmount[1].cases[0].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[0].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[0],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[1].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[1].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[1],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[2].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[2].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[2],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[3].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[3].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[3],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[4].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[4].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[4],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[5].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[5].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[5],
                    period,
                    contractSet,
                );
            },
        );
    });

    describe('Should check reward distribution in cases with a period of 8 blocks', async () => {
        const contractSet = {};
        const periodValues = testCasesValuesStructure.byBlockAmountInPeriods[7];
        const period = periodValues.blocks;
        log('PERIOD', period);
        beforeEach(async () => {
            const contracts = await helpers.initContracts({
                governorOwner: accounts[8],
                period,
                minSubscriptionStake: minCPSubscriptionStake,
            });
            Object.assign(this, contracts);
            Object.assign(contractSet, contracts);
            await this.governor.mint(this.token.address, REWARDS, '800000000000000000000');
            await this.governor.mint(this.token.address, ALICE, '800000000000000000000');
            await this.governor.mint(this.token.address, BOB, '800000000000000000000');
            await this.governor.mint(this.token.address, CHARLIE, '800000000000000000000');
            await this.governor.mint(this.token.address, DAVE, '800000000000000000000');
            await this.governor.mint(this.token.address, EVE, '800000000000000000000');
        });

        // Tests with 1 user
        it(
            periodValues.byUserAmount[0].cases[0].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[0].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[0],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[1].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[1].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[1],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[2].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[2].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[2],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[3].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[3].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[3],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[4].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[4].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[4],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[0].cases[5].testNumber +
                ': ' +
                periodValues.byUserAmount[0].cases[5].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[0].cases[5],
                    period,
                    contractSet,
                );
            },
        );

        // Tests with 2 users
        it(
            periodValues.byUserAmount[1].cases[0].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[0].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[0],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[1].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[1].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[1],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[2].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[2].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[2],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[3].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[3].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[3],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[4].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[4].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[4],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[1].cases[5].testNumber +
                ': ' +
                periodValues.byUserAmount[1].cases[5].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[1].cases[5],
                    period,
                    contractSet,
                );
            },
        );

        // Tests with 3 users
        it(
            periodValues.byUserAmount[2].cases[0].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[0].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[0],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[1].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[1].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[1],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[2].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[2].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[2],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[3].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[3].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[3],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[4].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[4].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[4],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[5].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[5].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[5],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[6].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[6].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[6],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[7].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[7].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[7],
                    period,
                    contractSet,
                );
            },
        );
        it(
            periodValues.byUserAmount[2].cases[8].testNumber +
                ': ' +
                periodValues.byUserAmount[2].cases[8].description,
            async () => {
                await checkRewardDistribution(
                    periodValues.byUserAmount[2].cases[8],
                    period,
                    contractSet,
                );
            },
        );
    });

    async function checkRewardDistribution(testValues, period, contracts) {
        log('Test number:', testValues.testNumber);

        // ////////////////////////////////////////
        // ///       DEPOSIT IN STAKING       /////
        // ////////////////////////////////////////

        let mocBalanceAfterFirstDeposit;
        let tokenBalanceAfterFirstDeposit;
        for (let userIndex1 = 0; userIndex1 < testValues.users.length; userIndex1++) {
            // Previous approve for deposit in Staking
            await contracts.token.approve(
                contracts.staking.address,
                testValues.users[userIndex1].depositAmount,
                {
                    from: users[userIndex1],
                },
            );
            log(
                'Making deposit of',
                testValues.users[userIndex1].depositAmount,
                'mocs by ' + testValues.users[userIndex1].name + '<---------------',
            );
            // Deposit mocs in Staking
            await contracts.staking.deposit(
                testValues.users[userIndex1].depositAmount,
                users[userIndex1],
                {
                    from: users[userIndex1],
                },
            );

            mocBalanceAfterFirstDeposit = await contracts.staking.getBalance(users[userIndex1]);
            tokenBalanceAfterFirstDeposit = await contracts.stakingMock.getBalanceInTokens(
                users[userIndex1],
            );
            log(
                testValues.users[userIndex1].name + "'s moc balance after first deposit",
                mocBalanceAfterFirstDeposit.toString(),
                'Expected:',
                testValues.users[userIndex1].mocBalanceAfterDeposit,
            );
            log(
                testValues.users[userIndex1].name + "'s internal token balance after first deposit",
                tokenBalanceAfterFirstDeposit.toString(),
                'Expected:',
                testValues.users[userIndex1].tokenBalanceAfterDeposit,
            );
            // Check stake in mocs was deposited
            assert.isTrue(
                mocBalanceAfterFirstDeposit.eq(
                    new BN(testValues.users[userIndex1].mocBalanceAfterDeposit),
                ),
            );
            // Check internal token balance was updated.
            assert.isTrue(
                tokenBalanceAfterFirstDeposit.eq(
                    new BN(testValues.users[userIndex1].tokenBalanceAfterDeposit),
                ),
            );
        }

        // ////////////////////////////////////////
        // /// TRANSFER REWARDS TO SUPPORTERS /////
        // ////////////////////////////////////////

        // Check Supporters's balance before reward deposit
        const supportersBalanceBeforeTransfer = await contracts.token.balanceOf(
            contracts.supporters.address,
        );
        log('Transfering', testValues.reward, 'mocs to Supporters <---------------');
        // Transfer rewards to Supporters contract to increase moc balance in it
        await contracts.token.transfer(contracts.supporters.address, testValues.reward, {
            from: REWARDS,
        });
        log('Calling distribute() in Supporters <---------------');
        // Call distribute to update Supporters' total moc balance
        await contracts.supporters.distribute({
            from: REWARDS,
        });
        // Check Supporters's balance after reward deposit
        const supportersBalanceAfterTransfer = await contracts.token.balanceOf(
            contracts.supporters.address,
        );
        // Check Supporters's balance changed correctly
        assert.isTrue(
            supportersBalanceAfterTransfer
                .sub(supportersBalanceBeforeTransfer)
                .eq(new BN(testValues.reward)),
        );

        let mocBalanceAfterReward;
        let tokenBalanceAfterReward;
        for (let userIndex2 = 0; userIndex2 < testValues.users.length; userIndex2++) {
            mocBalanceAfterReward = await contracts.staking.getBalance(users[userIndex2]);
            tokenBalanceAfterReward = await contracts.stakingMock.getBalanceInTokens(
                users[userIndex2],
            );
            log(
                testValues.users[userIndex2].name + "'s moc balance after reward transfer",
                mocBalanceAfterReward.toString(),
                'Expected:',
                testValues.users[userIndex2].mocBalanceAfterReward,
            );
            log(
                testValues.users[userIndex2].name +
                    "'s internal token balance after reward transfer",
                tokenBalanceAfterReward.toString(),
                'Expected:',
                testValues.users[userIndex2].tokenBalanceAfterReward,
            );
            // Check stake in mocs after reward transfer
            assert.isTrue(
                mocBalanceAfterReward.eq(
                    new BN(testValues.users[userIndex2].mocBalanceAfterReward),
                ),
            );
            // Check internal token balance after reward transfer
            assert.isTrue(
                tokenBalanceAfterReward.eq(
                    new BN(testValues.users[userIndex2].tokenBalanceAfterReward),
                ),
            );
        }
        // ////////////////////////////////////////
        // ///   GO THROUGH EARNINGS PERIOD   /////
        // ////////////////////////////////////////

        let mocBalance;
        let tokenBalance;
        for (let j = 1; j <= period; j++) {
            for (let k = 0; k < testValues.users.length; k++) {
                mocBalance = await contracts.staking.getBalance(users[k]);
                tokenBalance = await contracts.stakingMock.getBalanceInTokens(users[k]);
                log(
                    testValues.users[k].name +
                        "'s moc balance after " +
                        j.toString() +
                        ' period blocks',
                    mocBalance.toString(),
                    'Expected:',
                    testValues.users[k].periodValues[j].mocBalance,
                );
                log(
                    testValues.users[k].name +
                        "'s internal token balance after " +
                        j.toString() +
                        ' period blocks',
                    tokenBalance.toString(),
                    'Expected:',
                    testValues.users[k].periodValues[j].tokenBalance,
                );
                // Check user's stake in mocs
                assert.isTrue(
                    mocBalance.eq(new BN(testValues.users[k].periodValues[j].mocBalance)),
                );
                // Check user's internal token balance
                assert.isTrue(
                    tokenBalance.eq(new BN(testValues.users[k].periodValues[j].tokenBalance)),
                );
            }
            await helpers.mineBlocks(1);
        }
        log('///////////////////////////////////////////////////////////');
    }
});
