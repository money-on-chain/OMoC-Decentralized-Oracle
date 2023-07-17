// Most of the functionallity is tested via SupportersMock.js !!!
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Supporters = artifacts.require('Supporters');
const TestMOC = artifacts.require('@moc/shared/GovernedERC20');
const helpers = require('./helpers');

contract('SupportersEndEarningsChange', (accounts) => {
    const balance2BN = (x) => new BN(web3.utils.toWei(x.toString(), 'ether'));
    const sum = (a) => a.reduce((acc, val) => acc + val, 0);
    let supporters;
    let token;
    let governor;
    const period = 17 * 2; // we divide by 2
    const balances = [7, 11, 13, 5];
    // we need it to be multiple of sum()^2 and period^2
    const EARNINGS = Math.pow(sum(balances) * period, 3);
    const PAYER = accounts[1];
    const CALLER = accounts[2];
    const GOVERNOR_OWNER = accounts[3];
    const users = accounts.slice(5, 5 + balances.length);

    async function depositEarnings() {
        await governor.mint(token.address, PAYER, balance2BN(EARNINGS));
        await token.transfer(supporters.address, balance2BN(EARNINGS), { from: PAYER });
    }

    beforeEach(async () => {
        governor = await helpers.createGovernor(GOVERNOR_OWNER);
        token = await TestMOC.new();
        await token.initialize(governor.address);
        supporters = await helpers.deployProxySimple(Supporters, [
            governor.address,
            users,
            token.address,
            period,
        ]);
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const balance = balance2BN(balances[i]);
            await governor.mint(token.address, user, balance);
            await token.approve(supporters.address, balance, { from: user });
            await supporters.stakeAt(balance, user, { from: user });
        }
        await depositEarnings();
        expect(await token.balanceOf(supporters.address)).to.be.bignumber.equal(
            balance2BN(EARNINGS + sum(balances)),
        );
    });

    async function checkBalances(earnings) {
        let totalBalance = 0;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const current = await supporters.getMOCBalanceAt(user, user);
            const balance = balances[i];
            // earnigns is multiple of sum(balances)^2 so we get integers.
            const userBalance = balance + (balance * earnings) / sum(balances);
            expect(current, `User ${i} balance`).to.be.bignumber.equal(balance2BN(userBalance));
            totalBalance += userBalance;
        }
        // Available total balance to the stakers.
        // This is a call to _getAvailableMOC and is the function used to determine how much
        // each user can withdraw (without taking into account the token<->moc relationship).
        expect(await supporters.totalMoc()).to.be.bignumber.equal(balance2BN(totalBalance));
    }

    it('Creation', async () => {
        const tokens = await supporters.totalToken();
        expect(tokens, 'Initial token balance').to.be.bignumber.equal(balance2BN(sum(balances)));
        const mocs = await supporters.totalMoc();
        expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(balance2BN(sum(balances)));
        await checkBalances(0);
    });

    it('Distribute should succeed if contract is ready to distribute', async () => {
        const receipt = await supporters.distribute({ from: CALLER });
        const latestBlock = await helpers.getLatestBlock();
        expectEvent(receipt, 'PayEarnings', {
            earnings: balance2BN(EARNINGS),
            start: latestBlock,
            end: latestBlock.add(new BN(period)),
        });
        // After a round the earnings are distributed
        await checkBalances(0);
        await helpers.mineBlocks(period / 2);
        await checkBalances(EARNINGS / 2);
        await helpers.mineBlocks(period / 2);
        await checkBalances(EARNINGS);
    });

    it('Distribute should fail if contract not ready to distribute', async () => {
        await supporters.distribute({ from: CALLER });
        await expectRevert(supporters.distribute({ from: CALLER }), 'Not ready to distribute');
        await helpers.mineBlocks(period);
        await checkBalances(EARNINGS);
    });

    it('should change end earnings and be able to distribute again', async () => {
        await checkBalances(0);

        await supporters.distribute({ from: CALLER });
        await checkBalances(0);

        // Each block earnings
        await helpers.mineBlocks(1);
        const earnignPerBlock = EARNINGS / period;
        await checkBalances(earnignPerBlock);

        await helpers.mineBlocks(period / 2 - 3);
        await checkBalances(EARNINGS / 2 - 2 * earnignPerBlock);

        // We start in the block: period / 2 - 2.
        // This takes one block
        const change = await artifacts
            .require('SupportersStopPeriodChange')
            .new(supporters.address);
        // This executes the change contract one block after deploy (aka: period / 2 block - 1).
        await governor.execute(change);

        await helpers.mineBlocks(1);
        await checkBalances(EARNINGS / 2);

        // The contract stop distributing, earnings = 0
        await helpers.mineBlocks(10 * period);
        await checkBalances(EARNINGS / 2);

        const receipt = await supporters.distribute({ from: CALLER });
        const latestBlock = await helpers.getLatestBlock();
        expectEvent(receipt, 'PayEarnings', {
            earnings: balance2BN(EARNINGS / 2),
            start: latestBlock,
            end: latestBlock.add(new BN(period)),
        });
        await checkBalances(EARNINGS / 2);
        await helpers.mineBlocks(period);
        await checkBalances(EARNINGS);
    });

    it('should change end earnings and be able to distribute again, even with a deposit in the middle', async () => {
        await checkBalances(0);

        await supporters.distribute({ from: CALLER });
        await checkBalances(0);

        // Each block earnings
        await helpers.mineBlocks(1);
        const earnignPerBlock = EARNINGS / period;
        await checkBalances(earnignPerBlock);

        await helpers.mineBlocks(period / 2 - 3);
        await checkBalances(EARNINGS / 2 - 2 * earnignPerBlock);

        // We start in the block: period / 2 - 2.
        // This takes one block
        const change = await artifacts
            .require('SupportersStopPeriodChange')
            .new(supporters.address);
        // This executes the change contract one block after deploy (aka: period / 2 block - 1).
        await governor.execute(change);

        await helpers.mineBlocks(1);
        await checkBalances(EARNINGS / 2);

        await depositEarnings();
        expect(await token.balanceOf(supporters.address)).to.be.bignumber.equal(
            balance2BN(2 * EARNINGS + sum(balances)),
        );
        await checkBalances(EARNINGS / 2);

        // The contract stop distributing, earnings = 0
        await helpers.mineBlocks(10 * period);
        await checkBalances(EARNINGS / 2);

        const receipt = await supporters.distribute({ from: CALLER });
        const latestBlock = await helpers.getLatestBlock();
        expectEvent(receipt, 'PayEarnings', {
            earnings: balance2BN(EARNINGS * 1.5),
            start: latestBlock,
            end: latestBlock.add(new BN(period)),
        });
        await checkBalances(EARNINGS / 2);
        await helpers.mineBlocks(period);
        await checkBalances(2 * EARNINGS);
    });

    it('should be able to run the change contract a lot of times', async () => {
        await checkBalances(0);

        // Deploy once
        const change = await artifacts
            .require('SupportersStopPeriodChange')
            .new(supporters.address);

        await supporters.distribute({ from: CALLER });
        await checkBalances(0);

        // Each block earnings
        await helpers.mineBlocks(1);
        const earnignPerBlock = EARNINGS / period;
        await checkBalances(earnignPerBlock);

        // This executes the change contract, adds one block
        await governor.execute(change);

        await checkBalances(2 * earnignPerBlock);
        // The contract stop distributing, earnings = 0
        await helpers.mineBlocks(10 * period);
        await checkBalances(2 * earnignPerBlock);

        // Keep distributing
        const receipt = await supporters.distribute({ from: CALLER });
        const latestBlock = await helpers.getLatestBlock();
        expectEvent(receipt, 'PayEarnings', {
            earnings: balance2BN(EARNINGS - 2 * earnignPerBlock),
            start: latestBlock,
            end: latestBlock.add(new BN(period)),
        });
        await checkBalances(2 * earnignPerBlock);

        const newEarnignPerBlock = (EARNINGS - 2 * earnignPerBlock) / period;

        // We distribute now
        await helpers.mineBlocks(1);
        await checkBalances(2 * earnignPerBlock + newEarnignPerBlock);

        // Execute another time
        await governor.execute(change);
        const after2ExecEarnings = 2 * earnignPerBlock + 2 * newEarnignPerBlock;
        await checkBalances(after2ExecEarnings);
        // The contract stop distributing, earnings = 0
        await helpers.mineBlocks(10 * period);
        await checkBalances(after2ExecEarnings);

        // Start over with a deposit.
        await depositEarnings();
        expect(await token.balanceOf(supporters.address)).to.be.bignumber.equal(
            balance2BN(2 * EARNINGS + sum(balances)),
        );

        await checkBalances(after2ExecEarnings);
        // The contract stop distributing, earnings = 0
        await helpers.mineBlocks(10 * period);
        await checkBalances(after2ExecEarnings);

        const receipt2 = await supporters.distribute({ from: CALLER });
        const latestBlock2 = await helpers.getLatestBlock();
        expectEvent(receipt2, 'PayEarnings', {
            earnings: balance2BN(2 * EARNINGS - after2ExecEarnings),
            start: latestBlock2,
            end: latestBlock2.add(new BN(period)),
        });
        await checkBalances(after2ExecEarnings);

        const newEarnignPerBlock2 = (2 * EARNINGS - after2ExecEarnings) / period;
        // We distribute now
        await helpers.mineBlocks(1);
        await checkBalances(after2ExecEarnings + newEarnignPerBlock2);
        await helpers.mineBlocks(period - 1);
        await checkBalances(2 * EARNINGS);
        await helpers.mineBlocks(10);
        await checkBalances(2 * EARNINGS);
    });
});
