import { expect } from 'chai';
import { network } from 'hardhat';
import { createGovernor, getLatestBlock, waitForEvents } from './helpers.js';
import { ContractOf, Deployer, NetworkHelpers, Viem, WalletClients } from 'ts-test-helpers';

const toWei = (value: bigint) => value * 10n ** 18n;
const sum = (values: bigint[]) => values.reduce((acc, value) => acc + value, 0n);

describe('SupportersStopPeriodChange', function () {
    let deployer: Deployer;
    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let accounts: WalletClients;

    let supporters: ContractOf<'Supporters'>;
    let token: ContractOf<'GovernedERC20'>;
    let governor: Awaited<ReturnType<typeof createGovernor>>;

    const period = 34n;
    const balances = [7n, 11n, 13n, 5n];
    const earnings = (sum(balances) * period) ** 3n;

    let payer: WalletClients[number];
    let caller: WalletClients[number];
    let governorOwner: WalletClients[number];
    let users: WalletClients;

    async function depositEarnings() {
        await governor.mint(token.address, payer.account!.address, toWei(earnings));
        await token.write.transfer([supporters.address, toWei(earnings)], {
            account: payer.account!,
        });
    }

    async function checkBalances(distributedEarnings: bigint) {
        let totalBalance = 0n;

        for (let i = 0; i < users.length; i += 1) {
            const user = users[i];
            const balance = balances[i];
            const current = await supporters.read.getMOCBalanceAt([
                user.account!.address,
                user.account!.address,
            ]);
            const userBalance = balance + (balance * distributedEarnings) / sum(balances);

            expect(current, `User ${i} balance`).to.equal(toWei(userBalance));
            totalBalance += userBalance;
        }

        expect(await supporters.read.totalMoc()).to.equal(toWei(totalBalance));
    }

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        payer = accounts[1];
        caller = accounts[2];
        governorOwner = accounts[3];
        users = accounts.slice(5, 5 + balances.length) as WalletClients;

        governor = await createGovernor(deployer, governorOwner);

        token = await deployer.deploy('GovernedERC20');
        await token.write.initialize([governor.address]);

        supporters = await deployer.deployProxy('Supporters', [
            governor.address,
            users.map((user) => user.account!.address),
            token.address,
            period,
        ]);

        for (let i = 0; i < users.length; i += 1) {
            const user = users[i];
            const balance = toWei(balances[i]);

            await governor.mint(token.address, user.account!.address, balance);
            await token.write.approve([supporters.address, balance], {
                account: user.account!,
            });
            await supporters.write.stakeAt([balance, user.account!.address], {
                account: user.account!,
            });
        }

        await depositEarnings();

        expect(await token.read.balanceOf([supporters.address])).to.equal(
            toWei(earnings + sum(balances)),
        );
    });

    it('Creation', async function () {
        expect(await supporters.read.totalToken()).to.equal(toWei(sum(balances)));
        expect(await supporters.read.totalMoc()).to.equal(toWei(sum(balances)));
        await checkBalances(0n);
    });

    it('Distribute should succeed if contract is ready to distribute', async function () {
        const tx = await supporters.write.distribute({ account: caller.account! });
        const latestBlock = await getLatestBlock(viem);
        const event = (await waitForEvents(viem, supporters, 'PayEarnings', tx))[0].args;

        expect(event.earnings).to.equal(toWei(earnings));
        expect(event.start).to.equal(latestBlock);
        expect(event.end).to.equal(latestBlock + period);

        await checkBalances(0n);
        await networkHelpers.mine(Number(period / 2n));
        await checkBalances(earnings / 2n);
        await networkHelpers.mine(Number(period / 2n));
        await checkBalances(earnings);
    });

    it('Distribute should fail if contract not ready to distribute', async function () {
        await supporters.write.distribute({ account: caller.account! });

        await viem.assertions.revertWith(
            supporters.write.distribute({ account: caller.account! }),
            'Not ready to distribute',
        );

        await networkHelpers.mine(Number(period));
        await checkBalances(earnings);
    });

    it('should change end earnings and be able to distribute again', async function () {
        await checkBalances(0n);

        await supporters.write.distribute({ account: caller.account! });
        await checkBalances(0n);

        const earningsPerBlock = earnings / period;

        await networkHelpers.mine();
        await checkBalances(earningsPerBlock);

        await networkHelpers.mine(Number(period / 2n - 3n));
        await checkBalances(earnings / 2n - 2n * earningsPerBlock);

        const change = await deployer.deploy('SupportersStopPeriodChange', [supporters.address]);
        await governor.execute(change);

        await networkHelpers.mine();
        await checkBalances(earnings / 2n);

        await networkHelpers.mine(Number(10n * period));
        await checkBalances(earnings / 2n);

        const tx = await supporters.write.distribute({ account: caller.account! });
        const latestBlock = await getLatestBlock(viem);
        const event = (await waitForEvents(viem, supporters, 'PayEarnings', tx))[0].args;

        expect(event.earnings).to.equal(toWei(earnings / 2n));
        expect(event.start).to.equal(latestBlock);
        expect(event.end).to.equal(latestBlock + period);

        await checkBalances(earnings / 2n);
        await networkHelpers.mine(Number(period));
        await checkBalances(earnings);
    });

    it('should change end earnings and be able to distribute again, even with a deposit in the middle', async function () {
        await checkBalances(0n);

        await supporters.write.distribute({ account: caller.account! });
        await checkBalances(0n);

        const earningsPerBlock = earnings / period;

        await networkHelpers.mine();
        await checkBalances(earningsPerBlock);

        await networkHelpers.mine(Number(period / 2n - 3n));
        await checkBalances(earnings / 2n - 2n * earningsPerBlock);

        const change = await deployer.deploy('SupportersStopPeriodChange', [supporters.address]);
        await governor.execute(change);

        await networkHelpers.mine();
        await checkBalances(earnings / 2n);

        await depositEarnings();
        expect(await token.read.balanceOf([supporters.address])).to.equal(
            toWei(2n * earnings + sum(balances)),
        );
        await checkBalances(earnings / 2n);

        await networkHelpers.mine(Number(10n * period));
        await checkBalances(earnings / 2n);

        const tx = await supporters.write.distribute({ account: caller.account! });
        const latestBlock = await getLatestBlock(viem);
        const event = (await waitForEvents(viem, supporters, 'PayEarnings', tx))[0].args;

        expect(event.earnings).to.equal(toWei((3n * earnings) / 2n));
        expect(event.start).to.equal(latestBlock);
        expect(event.end).to.equal(latestBlock + period);

        await checkBalances(earnings / 2n);
        await networkHelpers.mine(Number(period));
        await checkBalances(2n * earnings);
    });

    it('should be able to run the change contract a lot of times', async function () {
        await checkBalances(0n);

        const change = await deployer.deploy('SupportersStopPeriodChange', [supporters.address]);

        await supporters.write.distribute({ account: caller.account! });
        await checkBalances(0n);

        const earningsPerBlock = earnings / period;

        await networkHelpers.mine();
        await checkBalances(earningsPerBlock);

        await governor.execute(change);
        await checkBalances(2n * earningsPerBlock);

        await networkHelpers.mine(Number(10n * period));
        await checkBalances(2n * earningsPerBlock);

        const tx = await supporters.write.distribute({ account: caller.account! });
        const latestBlock = await getLatestBlock(viem);
        const event = (await waitForEvents(viem, supporters, 'PayEarnings', tx))[0].args;
        const secondRoundEarnings = earnings - 2n * earningsPerBlock;

        expect(event.earnings).to.equal(toWei(secondRoundEarnings));
        expect(event.start).to.equal(latestBlock);
        expect(event.end).to.equal(latestBlock + period);

        await checkBalances(2n * earningsPerBlock);

        const newEarningsPerBlock = secondRoundEarnings / period;

        await networkHelpers.mine();
        await checkBalances(2n * earningsPerBlock + newEarningsPerBlock);

        await governor.execute(change);
        const afterSecondExecEarnings = 2n * earningsPerBlock + 2n * newEarningsPerBlock;
        await checkBalances(afterSecondExecEarnings);

        await networkHelpers.mine(Number(10n * period));
        await checkBalances(afterSecondExecEarnings);

        await depositEarnings();
        expect(await token.read.balanceOf([supporters.address])).to.equal(
            toWei(2n * earnings + sum(balances)),
        );

        await checkBalances(afterSecondExecEarnings);
        await networkHelpers.mine(Number(10n * period));
        await checkBalances(afterSecondExecEarnings);

        const tx2 = await supporters.write.distribute({ account: caller.account! });
        const latestBlock2 = await getLatestBlock(viem);
        const event2 = (await waitForEvents(viem, supporters, 'PayEarnings', tx2))[0].args;
        const thirdRoundEarnings = 2n * earnings - afterSecondExecEarnings;

        expect(event2.earnings).to.equal(toWei(thirdRoundEarnings));
        expect(event2.start).to.equal(latestBlock2);
        expect(event2.end).to.equal(latestBlock2 + period);

        await checkBalances(afterSecondExecEarnings);

        const newEarningsPerBlock2 = thirdRoundEarnings / period;

        await networkHelpers.mine();
        await checkBalances(afterSecondExecEarnings + newEarningsPerBlock2);
        await networkHelpers.mine(Number(period - 1n));
        await checkBalances(2n * earnings);
    });
});
