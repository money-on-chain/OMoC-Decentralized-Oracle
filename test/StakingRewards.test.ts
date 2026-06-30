import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import {
    Deployer,
    type NetworkHelpers,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';

// Replace by console.log to enable logging.
const log = (..._rest: any[]) => {};

describe('StakingRewards', function () {
    let accounts: WalletClients;
    let networkHelpers: NetworkHelpers;
    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let REWARDS: WalletClient;
    let ALICE: WalletClient;
    let BOB: WalletClient;
    let CHARLIE: WalletClient;
    let DAVE: WalletClient;
    let EVE: WalletClient;
    let users: WalletClient[];

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        REWARDS = accounts[1];
        ALICE = accounts[2];
        BOB = accounts[3];
        CHARLIE = accounts[4];
        DAVE = accounts[5];
        EVE = accounts[6];
        users = [ALICE, BOB, CHARLIE, DAVE, EVE];
    });

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
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
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
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
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
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
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
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
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
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
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
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
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
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
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
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
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
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
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
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '1',
                                        mocBalanceAfterDeposit: '1',
                                        tokenBalanceAfterDeposit: '1',
                                        mocBalanceAfterReward: '1',
                                        tokenBalanceAfterReward: '1',
                                        periodValues: [{}, { mocBalance: '1', tokenBalance: '1' }],
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
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '2',
                                        mocBalanceAfterDeposit: '2',
                                        tokenBalanceAfterDeposit: '2',
                                        mocBalanceAfterReward: '2',
                                        tokenBalanceAfterReward: '2',
                                        periodValues: [{}, { mocBalance: '2', tokenBalance: '2' }],
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
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
                                    },
                                    {
                                        name: 'BOB',
                                        depositAmount: '3',
                                        mocBalanceAfterDeposit: '3',
                                        tokenBalanceAfterDeposit: '3',
                                        mocBalanceAfterReward: '3',
                                        tokenBalanceAfterReward: '3',
                                        periodValues: [{}, { mocBalance: '3', tokenBalance: '3' }],
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
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
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '1', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
                                            { mocBalance: '2', tokenBalance: '1' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
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
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '2', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
                                            { mocBalance: '3', tokenBalance: '2' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
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
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '3', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
                                            { mocBalance: '4', tokenBalance: '3' },
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
        let periodValues;
        let period;
        let contractSet: Awaited<ReturnType<typeof initContracts>>;
        periodValues = testCasesValuesStructure.byBlockAmountInPeriods[0];
        period = periodValues.blocks;
        log('PERIOD', period);
        beforeEach(async () => {
            contractSet = await initContracts(
                deployer,
                accounts[8],
                BigInt(period),
                BigInt(minCPSubscriptionStake),
            );
            const { governor, token } = contractSet;
            await governor.mint(token.address, REWARDS.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, ALICE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, BOB.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, CHARLIE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, DAVE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, EVE.account!.address, 800n * 10n ** 18n);
        });

        for (const userAmount of periodValues.byUserAmount.slice(0, 2)) {
            for (const testCase of userAmount.cases.slice(0, 6)) {
                it(`${testCase.testNumber}: ${testCase.description}`, async () => {
                    await checkRewardDistribution(testCase, period, contractSet);
                });
            }
        }
    });

    describe('Should check reward distribution in cases with a period of 8 blocks', async () => {
        let periodValues;
        let period;
        let contractSet: Awaited<ReturnType<typeof initContracts>>;
        periodValues = testCasesValuesStructure.byBlockAmountInPeriods[7];
        period = periodValues.blocks;
        log('PERIOD', period);
        beforeEach(async () => {
            contractSet = await initContracts(
                deployer,
                accounts[8],
                BigInt(period),
                BigInt(minCPSubscriptionStake),
            );
            const { governor, token } = contractSet;
            await governor.mint(token.address, REWARDS.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, ALICE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, BOB.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, CHARLIE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, DAVE.account!.address, 800n * 10n ** 18n);
            await governor.mint(token.address, EVE.account!.address, 800n * 10n ** 18n);
        });

        for (const userAmount of periodValues.byUserAmount.slice(0, 3)) {
            for (const testCase of userAmount.cases) {
                it(`${testCase.testNumber}: ${testCase.description}`, async () => {
                    await checkRewardDistribution(testCase, period, contractSet);
                });
            }
        }
    });

    async function checkRewardDistribution(testValues: any, period: any, contracts: any) {
        log('Test number:', testValues.testNumber);

        //////////////////////////////////////////
        /////       DEPOSIT IN STAKING       /////
        //////////////////////////////////////////

        let mocBalanceAfterFirstDeposit;
        let tokenBalanceAfterFirstDeposit;
        for (let userIndex1 = 0; userIndex1 < testValues.users.length; userIndex1++) {
            const user1Account = users[userIndex1].account!;
            const user1Address = user1Account.address;
            // Previous approve for deposit in Staking
            await contracts.token.write.approve(
                [contracts.staking.address, testValues.users[userIndex1].depositAmount],
                {
                    account: user1Account,
                },
            );
            log(
                'Making deposit of',
                testValues.users[userIndex1].depositAmount,
                'mocs by ' + testValues.users[userIndex1].name + '<---------------',
            );
            // Deposit mocs in Staking
            await contracts.staking.write.deposit(
                [testValues.users[userIndex1].depositAmount, user1Address],
                {
                    account: user1Account,
                },
            );

            mocBalanceAfterFirstDeposit = await contracts.staking.read.getBalance([user1Address]);
            tokenBalanceAfterFirstDeposit = await contracts.stakingMock.read.getBalanceInTokens([
                user1Address,
            ]);
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
            expect(mocBalanceAfterFirstDeposit.toString()).to.be.equal(
                testValues.users[userIndex1].mocBalanceAfterDeposit,
            );
            // Check internal token balance was updated.
            expect(tokenBalanceAfterFirstDeposit.toString()).to.be.equal(
                testValues.users[userIndex1].tokenBalanceAfterDeposit,
            );
        }

        //////////////////////////////////////////
        ///// TRANSFER REWARDS TO SUPPORTERS /////
        //////////////////////////////////////////

        // Check Supporters's balance before reward deposit
        const supportersBalanceBeforeTransfer = await contracts.token.read.balanceOf([
            contracts.supporters.address,
        ]);
        log('Transfering', testValues.reward, 'mocs to Supporters <---------------');
        // Transfer rewards to Supporters contract to increase moc balance in it
        await contracts.token.write.transfer([contracts.supporters.address, testValues.reward], {
            account: REWARDS.account!,
        });
        log('Calling distribute() in Supporters <---------------');
        // Call distribute to update Supporters' total moc balance
        await contracts.supporters.write.distribute({
            account: REWARDS.account!,
        });
        // Check Supporters's balance after reward deposit
        const supportersBalanceAfterTransfer = await contracts.token.read.balanceOf([
            contracts.supporters.address,
        ]);
        // Check Supporters's balance changed correctly
        expect(
            (supportersBalanceAfterTransfer - supportersBalanceBeforeTransfer).toString(),
        ).to.be.equal(testValues.reward);

        let mocBalanceAfterReward;
        let tokenBalanceAfterReward;
        for (let userIndex2 = 0; userIndex2 < testValues.users.length; userIndex2++) {
            const user2Account = users[userIndex2].account!;
            const user2Address = user2Account.address;
            mocBalanceAfterReward = await contracts.staking.read.getBalance([user2Address]);
            tokenBalanceAfterReward = await contracts.stakingMock.read.getBalanceInTokens([
                user2Address,
            ]);
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
            expect(mocBalanceAfterReward.toString()).to.be.equal(
                testValues.users[userIndex2].mocBalanceAfterReward,
            );
            // Check internal token balance after reward transfer
            expect(tokenBalanceAfterReward.toString()).to.be.equal(
                testValues.users[userIndex2].tokenBalanceAfterReward,
            );
        }
        //////////////////////////////////////////
        /////   GO THROUGH EARNINGS PERIOD   /////
        //////////////////////////////////////////

        let mocBalance;
        let tokenBalance;
        for (let j = 1; j <= period; j++) {
            for (let k = 0; k < testValues.users.length; k++) {
                const account = users[k].account!;
                const address = account.address;
                mocBalance = await contracts.staking.read.getBalance([address]);
                tokenBalance = await contracts.stakingMock.read.getBalanceInTokens([address]);
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
                expect(mocBalance.toString()).to.be.equal(
                    testValues.users[k].periodValues[j].mocBalance,
                );
                // Check user's internal token balance
                expect(tokenBalance.toString()).to.be.equal(
                    testValues.users[k].periodValues[j].tokenBalance,
                );
            }
            await networkHelpers.mine(1);
        }
        log('///////////////////////////////////////////////////////////');
    }
});
