// Most of the functionallity is tested via SupportersMock.js !!!
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Supporters = artifacts.require('Supporters');
const TestMOC = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedERC20');
const helpers = require('./helpers');

contract('SupportersEndEarningsChange', (accounts) => {
    const balance2BN = (x) => new BN(web3.utils.toWei(x.toString(), 'ether'));
    const sum = (a) => a.reduce((acc, val) => acc + val, 0);
    let supporters;
    let token;
    let governor;
    const period = 2 * 100; // we divide by 2
    const balances = [1, 2, 3, 4];
    const EARNINGS = sum(balances) * 100;

    const PAYER = accounts[1];
    const CALLER = accounts[2];
    const GOVERNOR_OWNER = accounts[3];
    const users = accounts.slice(5, 5 + balances.length);

    beforeEach(async () => {
        governor = await helpers.createGovernor(GOVERNOR_OWNER);
        token = await TestMOC.new();
        await token.initialize(governor.address);
        supporters = await Supporters.new();
        await supporters.initialize(governor.address, users, token.address, period);
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const balance = balance2BN(balances[i]);
            await governor.mint(token.address, user, balance);
            await token.approve(supporters.address, balance, { from: user });
            await supporters.stakeAt(balance, user, { from: user });
        }
        await governor.mint(token.address, PAYER, balance2BN(EARNINGS));
        await token.transfer(supporters.address, balance2BN(EARNINGS), { from: PAYER });
        expect(await token.balanceOf(supporters.address))
            .to.be.bignumber.equal(balance2BN(EARNINGS + sum(balances)));
    });

    async function checkBalances(earnings) {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const current = await supporters.getMOCBalanceAt(user, user);
            const balance = balances[i];
            expect(current).to.be.bignumber.equal(balance2BN(balance * (1 + earnings / sum(balances))));
        }
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
        await supporters.distribute({ from: CALLER });
        await checkBalances(0);
        await helpers.mineBlocks(1);

        // Each block earnings
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

        await governor.mint(token.address, PAYER, balance2BN(EARNINGS));
        await token.transfer(supporters.address, balance2BN(EARNINGS), { from: PAYER });
        expect(await token.balanceOf(supporters.address))
            .to.be.bignumber.equal(balance2BN(2 * EARNINGS + sum(balances)));

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
});
