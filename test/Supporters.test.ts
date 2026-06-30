import { expect } from 'chai';
import { network } from 'hardhat';
import {
    createGovernor,
    getLatestBlock,
    initContractsWithCoinPairs,
    waitForEvents,
    type OracleStakeData,
} from './helpers.js';
import { assertSameAddress, Deployer, type WalletClients, type ContractOf } from 'ts-test-helpers';
import type { Address } from 'viem';

describe('Supporters', function () {
    const period = 10n;
    const BALANCE_USER1 = 1n * 10n ** 18n;
    const BALANCE_USER2 = 1n * 10n ** 18n;
    const BALANCE_USER3 = 1n * 10n ** 18n;
    const BALANCE_PAYER = 10n * 10n ** 18n;

    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let accounts: WalletClients;
    let supporters: any;
    let token: any;
    let governor: Awaited<ReturnType<typeof createGovernor>>;

    const user1Index = 1;
    const user2Index = 2;
    const user3Index = 3;
    const payerIndex = 9;
    const governorOwnerIndex = 8;

    async function deploySupporters(governorAddress: Address, whitelist: Address[] = []) {
        supporters = await deployer.deployProxy('Supporters', [
            governorAddress,
            whitelist,
            token.address,
            period,
        ]);
    }

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    describe('Creation', function () {
        beforeEach(async function () {
            governor = await createGovernor(deployer, accounts[governorOwnerIndex]);
            token = await deployer.deploy('GovernedERC20');
            await token.write.initialize([governor.address]);
            await deploySupporters(governor.address);
        });

        it('check creation', async function () {
            expect(supporters).to.not.equal(undefined);
            const mocToken = await supporters.read.mocToken();
            assertSameAddress(mocToken, token.address);
        });

        it('check initialization', async function () {
            expect(await supporters.read.totalMoc()).to.equal(0n);
            expect(await supporters.read.totalToken()).to.equal(0n);
        });

        it('must fail for addresses that are not whitelisted', async function () {
            const user2 = accounts[user2Index];
            const user3 = accounts[user3Index];
            await viem.assertions.revertWith(
                supporters.write.stakeAt([BALANCE_USER1, user3.account!.address], {
                    account: user2.account!,
                }),
                'Address is not whitelisted',
            );
            await viem.assertions.revertWith(
                supporters.write.withdrawFrom([BALANCE_USER1, user3.account!.address], {
                    account: user2.account!,
                }),
                'Address is not whitelisted',
            );
        });
    });

    describe('Subaccounts', function () {
        const INITIAL_BALANCE = BALANCE_USER1 + BALANCE_USER1;

        beforeEach(async function () {
            governor = await createGovernor(deployer, accounts[governorOwnerIndex]);
            token = await deployer.deploy('GovernedERC20');
            await token.write.initialize([governor.address]);
            await deploySupporters(governor.address, [accounts[user1Index].account!.address]);

            const user1 = accounts[user1Index];
            const user2 = accounts[user2Index];
            const user3 = accounts[user3Index];
            const payer = accounts[payerIndex];

            await governor.mint(token.address, user1.account!.address, INITIAL_BALANCE);
            await governor.mint(token.address, user2.account!.address, BALANCE_USER2);
            await governor.mint(token.address, user3.account!.address, BALANCE_USER3);
            await governor.mint(token.address, payer.account!.address, BALANCE_PAYER);

            await token.write.approve([supporters.address, INITIAL_BALANCE], {
                account: user1.account!,
            });
        });

        it('stake', async function () {
            const user1 = accounts[user1Index];
            const user3 = accounts[user3Index];

            await supporters.write.stakeAt([BALANCE_USER1, user1.account!.address], {
                account: user1.account!,
            });
            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user1.account!.address,
                ]),
            ).to.equal(BALANCE_USER1);
            expect(await token.read.balanceOf([user1.account!.address])).to.equal(BALANCE_USER1);

            await supporters.write.stakeAt([BALANCE_USER1, user3.account!.address], {
                account: user1.account!,
            });

            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user1.account!.address,
                ]),
            ).to.equal(BALANCE_USER1);
            expect(
                await supporters.read.getBalanceAt([
                    user3.account!.address,
                    user3.account!.address,
                ]),
            ).to.equal(0n);
            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user3.account!.address,
                ]),
            ).to.equal(BALANCE_USER1);
            expect(
                await supporters.read.getBalanceAt([
                    user3.account!.address,
                    user1.account!.address,
                ]),
            ).to.equal(0n);
            expect(await token.read.balanceOf([user1.account!.address])).to.equal(0n);
        });

        it('withdraw', async function () {
            const user1 = accounts[user1Index];
            const user3 = accounts[user3Index];

            await supporters.write.stakeAt([BALANCE_USER1, user1.account!.address], {
                account: user1.account!,
            });
            await supporters.write.stakeAt([BALANCE_USER1, user3.account!.address], {
                account: user1.account!,
            });
            await supporters.write.withdrawFrom([BALANCE_USER1, user1.account!.address], {
                account: user1.account!,
            });
            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user1.account!.address,
                ]),
            ).to.equal(0n);
            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user3.account!.address,
                ]),
            ).to.equal(BALANCE_USER1);
            await supporters.write.withdrawFrom([BALANCE_USER1, user3.account!.address], {
                account: user1.account!,
            });
            expect(
                await supporters.read.getBalanceAt([
                    user1.account!.address,
                    user3.account!.address,
                ]),
            ).to.equal(0n);
            expect(await token.read.balanceOf([user1.account!.address])).to.equal(INITIAL_BALANCE);
        });
    });

    describe('IterableWhiteList', function () {
        beforeEach(async function () {
            const mockGovernor = await deployer.deploy('MockGovernor', [
                accounts[governorOwnerIndex].account!.address,
            ]);
            token = await deployer.deploy('GovernedERC20');
            await token.write.initialize([mockGovernor.address]);
            supporters = await deployer.deployProxy('Supporters', [
                mockGovernor.address,
                [],
                token.address,
                period,
            ]);
        });

        it('add and remove', async function () {
            await supporters.write.addToWhitelist([accounts[4].account!.address], {
                account: accounts[governorOwnerIndex].account!,
            });
            await supporters.write.addToWhitelist([accounts[5].account!.address], {
                account: accounts[governorOwnerIndex].account!,
            });
            expect(await supporters.read.isWhitelisted([accounts[1].account!.address])).to.equal(
                false,
            );
            expect(await supporters.read.isWhitelisted([accounts[4].account!.address])).to.equal(
                true,
            );
            expect(await supporters.read.isWhitelisted([accounts[5].account!.address])).to.equal(
                true,
            );
            await supporters.write.removeFromWhitelist([accounts[4].account!.address], {
                account: accounts[governorOwnerIndex].account!,
            });
            expect(await supporters.read.isWhitelisted([accounts[4].account!.address])).to.equal(
                false,
            );
        });
    });

    describe('Governance', function () {
        beforeEach(async function () {
            governor = await createGovernor(deployer, accounts[governorOwnerIndex]);
            token = await deployer.deploy('GovernedERC20');
            await token.write.initialize([governor.address]);
            await deploySupporters(governor.address);
        });

        it('should fail in if not a governor call', async function () {
            await viem.assertions.revertWith(
                supporters.write.addToWhitelist([accounts[0].account!.address], {
                    account: accounts[0].account!,
                }),
                'not_authorized_changer',
            );
        });

        it('should set period', async function () {
            expect(await supporters.read.period()).to.equal(10n);
            const change = await deployer.deploy('SupportersPeriodChange', [
                supporters.address,
                123n,
            ]);
            await governor.execute(change);
            expect(await supporters.read.period()).to.equal(123n);
        });
    });

    describe('Distribute', function () {
        const EARNINGS = 1n * 10n ** 18n;
        const period = 3n;
        let contracts: Awaited<ReturnType<typeof initContractsWithCoinPairs>>;
        let oracleData: OracleStakeData[];
        let supporters: ContractOf<'Supporters'>;
        let token: ContractOf<'GovernedERC20'>;

        beforeEach(async function () {
            contracts = await initContractsWithCoinPairs(deployer, accounts[governorOwnerIndex]);
            supporters = contracts.supporters;
            token = contracts.token;
            oracleData = [
                {
                    name: 'oracle-a.io',
                    stake: 4n * 10n ** 18n,
                    account: accounts[1],
                    owner: accounts[2],
                    address: accounts[1].account!.address,
                },
                {
                    name: 'oracle-b.io',
                    stake: 8n * 10n ** 18n,
                    account: accounts[3],
                    owner: accounts[4],
                    address: accounts[3].account!.address,
                },
                {
                    name: 'oracle-c.io',
                    stake: 1n * 10n ** 18n,
                    account: accounts[5],
                    owner: accounts[6],
                    address: accounts[5].account!.address,
                },
                {
                    name: 'oracle-d.io',
                    stake: 3n * 10n ** 18n,
                    account: accounts[7],
                    owner: accounts[8],
                    address: accounts[7].account!.address,
                },
            ];

            for (const idx of [0, 2, 4, 6, 8]) {
                await contracts.governor.mint(
                    token.address,
                    accounts[idx].account!.address,
                    800n * 10n ** 18n,
                );
            }
        });

        it('Distribute should fail if contract not ready to distribute', async function () {
            expect(await contracts.staking.read.totalToken()).to.equal(0n);
            expect(await contracts.staking.read.totalMoc()).to.equal(0n);
            await token.write.transfer([supporters.address, EARNINGS], {
                account: accounts[2].account!,
            });
            await viem.assertions.revertWith(
                supporters.write.distribute({ account: accounts[2].account! }),
                'Not ready to distribute',
            );
        });

        it('Distribute should succeed if contract is ready to distribute', async function () {
            await token.write.transfer([supporters.address, EARNINGS], {
                account: accounts[2].account!,
            });
            await token.write.approve([contracts.staking.address, oracleData[0].stake], {
                account: oracleData[0].owner.account!,
            });

            await contracts.staking.write.deposit(
                [oracleData[0].stake, oracleData[0].owner.account!.address],
                {
                    account: oracleData[0].owner.account!,
                },
            );

            const tx = await supporters.write.distribute({ account: accounts[2].account! });
            const latestBlock = await getLatestBlock(viem);
            const events = await waitForEvents(viem, supporters, 'PayEarnings', tx);
            const event = events[0].args;

            expect(event.earnings).to.equal(EARNINGS);
            expect(event.start).to.equal(latestBlock);
            expect(event.end).to.equal(latestBlock + period);
        });
    });
});
