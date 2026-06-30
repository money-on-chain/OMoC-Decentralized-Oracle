import { expect } from 'chai';
import { network } from 'hardhat';
import { increaseTime, increaseTimeTo, waitForEvents } from './helpers.js';
import {
    assertSameAddress,
    ContractOf,
    Deployer,
    Viem,
    WalletClient,
    WalletClients,
} from 'ts-test-helpers';
import { Address } from 'viem';

describe('DelayMachine', function () {
    let viem: Viem;
    let networkHelpers: Awaited<ReturnType<typeof network.create>>['networkHelpers'];
    let accounts: WalletClients;

    let governorOwner: WalletClient;
    let destinationMocHolder: WalletClient;
    let sourceMocHolder: WalletClient;
    let dummyAccount: WalletClient;

    const INITIAL_BALANCE = 100000000000000000000n;

    function notExpired(expiration: bigint, currentTime: bigint, expirationDelta: bigint) {
        return expiration > currentTime && expiration <= expirationDelta + currentTime;
    }

    async function createContracts(source: Address) {
        const deployer = await Deployer.default(viem);
        const governor = await deployer.deploy('MockGovernor', [governorOwner.account!.address]);
        const erc20 = await deployer.deploy('GovernedERC20');
        await erc20.write.initialize([governor.address]);
        const delay = await deployer.deployUninitializedProxy('DelayMachine');
        await delay.write.initialize([governor.address, erc20.address, source]);
        await erc20.write.mint([sourceMocHolder.account!.address, INITIAL_BALANCE], {
            account: governorOwner.account!,
        });
        return { erc20, delay };
    }

    async function depositViaStaking(
        contract: ContractOf<'DelayMachine'>,
        token: ContractOf<'GovernedERC20'>,
        staking: ContractOf<'MOCKStakingMachine'>,
        amount: bigint,
        expirationSecs: bigint,
    ) {
        await token.write.approve([staking.address, amount], {
            account: sourceMocHolder.account!,
        });
        await staking.write.depositFrom(
            [amount, destinationMocHolder.account!.address, sourceMocHolder.account!.address],
            {
                account: sourceMocHolder.account!,
            },
        );
        expect(await token.read.balanceOf([staking.address])).to.equal(amount);

        const prevBalance = await token.read.balanceOf([contract.address]);
        const tx = await staking.write.withdraw([amount, expirationSecs], {
            account: sourceMocHolder.account!,
        });

        expect(await token.read.balanceOf([staking.address])).to.equal(0n);
        expect(await token.read.balanceOf([contract.address])).to.equal(prevBalance + amount);

        const event = (await waitForEvents(viem, staking, 'PaymentDeposit', tx))[0];

        return event.args.id;
    }

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        accounts = await viem.getWalletClients();
        governorOwner = accounts[0];
        destinationMocHolder = accounts[2];
        sourceMocHolder = accounts[3];
        dummyAccount = accounts[4];
    });

    describe('direct operation', function () {
        let contract: ContractOf<'DelayMachine'>;
        let token: ContractOf<'GovernedERC20'>;

        beforeEach(async function () {
            ({ erc20: token, delay: contract } = await createContracts(
                sourceMocHolder.account!.address,
            ));
        });

        it('creation', async function () {
            expect(await token.read.balanceOf([sourceMocHolder.account!.address])).to.equal(
                INITIAL_BALANCE,
            );
            await token.write.approve([contract.address, 123n], {
                account: sourceMocHolder.account!,
            });
            expect(
                await token.read.allowance([sourceMocHolder.account!.address, contract.address]),
            ).to.equal(123n);
        });

        it('deposit fail', async function () {
            await viem.assertions.revertWith(
                contract.write.deposit([250n, destinationMocHolder.account!.address, 3600n], {
                    account: dummyAccount.account!,
                }),
                'Wrong source',
            );
        });

        it('deposit', async function () {
            const expirationSecs = 3600n;
            const amount = 250n;

            await token.write.approve([contract.address, amount], {
                account: sourceMocHolder.account!,
            });
            const tx = await contract.write.deposit(
                [amount, destinationMocHolder.account!.address, expirationSecs],
                { account: sourceMocHolder.account! },
            );

            expect(
                await contract.read.getBalance([destinationMocHolder.account!.address]),
            ).to.equal(amount);
            const [ids, amounts, expirations] = await contract.read.getTransactions([
                destinationMocHolder.account!.address,
            ]);
            expect(ids[0]).to.equal(1n);
            expect(amounts[0]).to.equal(amount);

            const latest = await viem
                .getPublicClient()
                .then((pc) => pc.getBlock({ blockTag: 'latest' }));
            expect(notExpired(expirations[0], BigInt(latest.timestamp), expirationSecs)).to.equal(
                true,
            );

            const e = (await waitForEvents(viem, contract, 'PaymentDeposit', tx))[0].args;
            assertSameAddress(e.source, sourceMocHolder.account!.address);
            assertSameAddress(e.destination, destinationMocHolder.account!.address);
            expect(e.amount).to.eq(amount);
            expect(e.expiration).to.eq(expirationSecs);
        });

        it('withdraw fail', async function () {
            const expirationSecs = 3600n;
            const amount = 250n;

            await token.write.approve([contract.address, amount], {
                account: sourceMocHolder.account!,
            });
            await contract.write.deposit(
                [amount, destinationMocHolder.account!.address, expirationSecs],
                {
                    account: sourceMocHolder.account!,
                },
            );

            await viem.assertions.revertWith(
                contract.write.withdraw([1n], { account: sourceMocHolder.account! }),
                'Invalid ID',
            );
            await viem.assertions.revertWith(
                contract.write.withdraw([1n], { account: destinationMocHolder.account! }),
                'Not expired',
            );
        });

        it('withdraw success', async function () {
            const expirationSecs = 3600n;
            const amount = 250n;

            await token.write.approve([contract.address, amount], {
                account: sourceMocHolder.account!,
            });
            await contract.write.deposit(
                [amount, destinationMocHolder.account!.address, expirationSecs],
                {
                    account: sourceMocHolder.account!,
                },
            );

            const startBalance = await token.read.balanceOf([
                destinationMocHolder.account!.address,
            ]);
            await increaseTime(networkHelpers, expirationSecs + 1n);
            const tx = await contract.write.withdraw([1n], {
                account: destinationMocHolder.account!,
            });

            const e = (await waitForEvents(viem, contract, 'PaymentWithdraw', tx))[0].args;
            assertSameAddress(e.source, sourceMocHolder.account!.address);
            assertSameAddress(e.destination, destinationMocHolder.account!.address);
            expect(e.amount).to.eq(amount);

            const endBalance = await token.read.balanceOf([destinationMocHolder.account!.address]);
            expect(endBalance - startBalance).to.equal(amount);
        });
    });

    describe('stacking machine mock operation', function () {
        let contract: ContractOf<'DelayMachine'>;
        let token: ContractOf<'GovernedERC20'>;
        let staking: ContractOf<'MOCKStakingMachine'>;

        beforeEach(async function () {
            const deployer = await Deployer.default(viem);
            staking = await deployer.deploy('MOCKStakingMachine', []);
            ({ erc20: token, delay: contract } = await createContracts(staking.address));
            await staking.write.initialize([contract.address, token.address]);
        });

        it('deposit', async function () {
            await depositViaStaking(contract, token, staking, 250n, 3600n);
            expect(
                await contract.read.getBalance([destinationMocHolder.account!.address]),
            ).to.equal(250n);
        });

        it('withdraw fail', async function () {
            const payId = await depositViaStaking(contract, token, staking, 250n, 3600n);
            await viem.assertions.revertWith(
                contract.write.withdraw([payId], { account: sourceMocHolder.account! }),
                'Invalid ID',
            );
            await viem.assertions.revertWith(
                contract.write.withdraw([payId], { account: destinationMocHolder.account! }),
                'Not expired',
            );
        });

        it('withdraw success', async function () {
            const amount = 250n;
            const payId = await depositViaStaking(contract, token, staking, amount, 3600n);
            const startBalance = await token.read.balanceOf([
                destinationMocHolder.account!.address,
            ]);
            await increaseTime(networkHelpers, 3601n);
            const tx = await contract.write.withdraw([payId], {
                account: destinationMocHolder.account!,
            });
            const e = (await waitForEvents(viem, contract, 'PaymentWithdraw', tx))[0].args;
            assertSameAddress(e.source, staking.address);
            assertSameAddress(e.destination, destinationMocHolder.account!.address);
            expect(e.amount).to.eq(amount);

            const endBalance = await token.read.balanceOf([destinationMocHolder.account!.address]);
            expect(endBalance - startBalance).to.equal(amount);
        });

        it('cancel fail', async function () {
            const payId = await depositViaStaking(contract, token, staking, 250n, 3600n);
            await viem.assertions.revertWith(
                contract.write.cancel([payId], { account: sourceMocHolder.account! }),
                'Invalid ID',
            );
        });

        it('cancel success', async function () {
            const amount = 250n;
            const payId = await depositViaStaking(contract, token, staking, amount, 3600n);

            assertSameAddress(await staking.read.source(), sourceMocHolder.account!.address);
            const startBalance = await token.read.balanceOf([staking.address]);
            const tx = await contract.write.cancel([payId], {
                account: destinationMocHolder.account!,
            });
            const e = (await waitForEvents(viem, contract, 'PaymentCancel', tx))[0].args;
            assertSameAddress(e.source, staking.address);
            assertSameAddress(e.destination, destinationMocHolder.account!.address);
            expect(e.amount).to.eq(amount);

            assertSameAddress(
                await staking.read.destination(),
                destinationMocHolder.account!.address,
            );
            assertSameAddress(await staking.read.source(), contract.address);
            const endBalance = await token.read.balanceOf([staking.address]);
            expect(endBalance - startBalance).to.equal(amount);
        });
    });

    describe('multiple deposits [slow] [skip-on-coverage]', function () {
        let staking: ContractOf<'MOCKStakingMachine'>;
        let contract: ContractOf<'DelayMachine'>;
        let token: ContractOf<'GovernedERC20'>;

        beforeEach(async function () {
            const deployer = await Deployer.default(viem);
            staking = await deployer.deploy('MOCKStakingMachine', []);
            ({ erc20: token, delay: contract } = await createContracts(staking.address));
            await staking.write.initialize([contract.address, token.address]);
        });

        it('withdraw', async function () {
            const expirations = [20n, 40n, 60n, 80n, 100n];
            const amounts = [10n, 20n, 30n, 40n, 50n];
            const inserted: Array<{ id: bigint; amount: bigint; expiration: bigint }> = [];
            let total = 0n;

            for (let i = 0; i < expirations.length; i += 1) {
                const id = await depositViaStaking(
                    contract,
                    token,
                    staking,
                    amounts[i],
                    expirations[i],
                );
                total += amounts[i];
                expect(
                    await contract.read.getBalance([destinationMocHolder.account!.address]),
                ).to.equal(total);
                const [, , txExpirations] = await contract.read.getTransactions([
                    destinationMocHolder.account!.address,
                ]);
                inserted.push({ id, amount: amounts[i], expiration: txExpirations[i] });
            }

            inserted.sort((a, b) => (a.expiration < b.expiration ? -1 : 1));

            for (let i = 0; i < inserted.length; i += 1) {
                await increaseTimeTo(networkHelpers, inserted[i].expiration + 1n);

                for (let j = 0; j < inserted.length; j += 1) {
                    if (j < i) {
                        await viem.assertions.revertWith(
                            contract.write.withdraw([inserted[j].id], {
                                account: destinationMocHolder.account!,
                            }),
                            'Invalid ID',
                        );
                    } else if (j === i) {
                        const startBalance = await token.read.balanceOf([
                            destinationMocHolder.account!.address,
                        ]);
                        const tx = await contract.write.withdraw([inserted[j].id], {
                            account: destinationMocHolder.account!,
                        });
                        // TODO: replace this event assertion with a typed viem event decoder.
                        await tx;

                        const e = (await waitForEvents(viem, contract, 'PaymentWithdraw', tx))[0]
                            .args;
                        assertSameAddress(e.source, staking.address);
                        assertSameAddress(e.destination, destinationMocHolder.account!.address);
                        expect(e.amount).to.eq(inserted[j].amount);

                        const endBalance = await token.read.balanceOf([
                            destinationMocHolder.account!.address,
                        ]);
                        expect(endBalance - startBalance).to.equal(inserted[j].amount);
                    } else {
                        await viem.assertions.revertWith(
                            contract.write.withdraw([inserted[j].id], {
                                account: destinationMocHolder.account!,
                            }),
                            'Not expired',
                        );
                    }
                }
            }
        });
    });
});
