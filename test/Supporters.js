// Most of the functionallity is tested via SupportersMock.js !!!
const { BN, expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Supporters = artifacts.require('Supporters');
const TestMOC = artifacts.require('@moc/shared/GovernedERC20');
const MockGovernor = artifacts.require('@moc/shared/MockGovernor');
const helpers = require('./helpers');

contract('Supporters', (accounts) => {
    let supporters;
    let token;
    const period = 10;
    const BALANCE_USER1 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_USER2 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_USER3 = new BN(web3.utils.toWei('1', 'ether'));
    const BALANCE_PAYER = new BN(web3.utils.toWei('10', 'ether'));

    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const payer = accounts[9];
    const GOVERNOR_OWNER = accounts[8];
    describe('Creation', () => {
        beforeEach(async () => {
            const governor = await helpers.createGovernor(GOVERNOR_OWNER);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await Supporters.new();
            await supporters.initialize(governor.address, [], token.address, period);
        });

        it('check creation', async () => {
            assert.ok(supporters);
            const mocToken = await supporters.mocToken();
            assert.equal(mocToken, token.address, 'MOC token address');
        });

        it('check initialization', async () => {
            const mocs = await supporters.totalMoc();
            expect(mocs, 'Available MOC').to.be.bignumber.equal(new BN(0));

            const tokens = await supporters.totalToken();
            expect(tokens, 'Available tokens').to.be.bignumber.equal(new BN(0));
        });

        it('must fail for addresses that are not whitelisted', async () => {
            await expectRevert(
                supporters.stakeAt(BALANCE_USER1, user3, { from: user2 }),
                'Address is not whitelisted',
            );
            await expectRevert(
                supporters.withdrawFrom(BALANCE_USER1, user3, { from: user2 }),
                'Address is not whitelisted',
            );
        });
    });

    describe('Subaccounts', () => {
        const INITIAL_BALANCE = BALANCE_USER1.add(BALANCE_USER1);

        beforeEach(async () => {
            const governor = await helpers.createGovernor(accounts[8]);
            token = await TestMOC.new();
            await token.initialize(governor.address);
            supporters = await Supporters.new();
            await supporters.initialize(governor.address, [user1], token.address, period);

            await governor.mint(token.address, user1, INITIAL_BALANCE);
            await governor.mint(token.address, user2, BALANCE_USER2);
            await governor.mint(token.address, user3, BALANCE_USER3);
            await governor.mint(token.address, payer, BALANCE_PAYER);

            await token.approve(supporters.address, INITIAL_BALANCE, { from: user1 });
        });

        it('stake', async () => {
            await supporters.stakeAt(BALANCE_USER1, user1, { from: user1 });

            let tokens = await supporters.getBalanceAt(user1, user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.stakeAt(BALANCE_USER1, user3, { from: user1 });

            tokens = await supporters.getBalanceAt(user1, user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(BALANCE_USER1);

            tokens = await supporters.getBalanceAt(user3, user3);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(BALANCE_USER1);

            tokens = await supporters.getBalanceAt(user3, user1);
            expect(tokens, 'Final user token balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(new BN(0));
        });

        it('withdraw', async () => {
            await supporters.stakeAt(BALANCE_USER1, user1, { from: user1 });

            let tokens = await supporters.getBalanceAt(user1, user1);
            expect(tokens, 'Initial user token balance').to.be.bignumber.equal(BALANCE_USER1);

            let mocs = await token.balanceOf(user1);
            expect(mocs, 'Initial user MOC balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.stakeAt(BALANCE_USER1, user3, { from: user1 });

            await supporters.withdrawFrom(BALANCE_USER1, user1, { from: user1 });

            tokens = await supporters.getBalanceAt(user1, user1);
            expect(tokens, 'User token balance').to.be.bignumber.equal(new BN(0));

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'User subaccount token balance').to.be.bignumber.equal(BALANCE_USER1);

            await supporters.withdrawFrom(BALANCE_USER1, user3, { from: user1 });

            tokens = await supporters.getBalanceAt(user1, user3);
            expect(tokens, 'Final user subaccount token balance').to.be.bignumber.equal(new BN(0));

            mocs = await token.balanceOf(user1);
            expect(mocs, 'Final user MOC balance').to.be.bignumber.equal(INITIAL_BALANCE);
        });
    });

    describe('IterableWhiteList', () => {
        beforeEach(async () => {
            this.governor = await MockGovernor.new(GOVERNOR_OWNER);
            this.token = await TestMOC.new();
            await this.token.initialize(this.governor.address);
            this.supporters = await Supporters.new();
            await this.supporters.initialize(this.governor.address, [], this.token.address, period);
        });

        it('add and remove', async () => {
            await this.supporters.addToWhitelist(accounts[4], { from: GOVERNOR_OWNER });
            await this.supporters.addToWhitelist(accounts[5], { from: GOVERNOR_OWNER });
            expect(await this.supporters.isWhitelisted(accounts[1])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[4])).to.be.true;
            expect(await this.supporters.isWhitelisted(accounts[5])).to.be.true;
            await this.supporters.removeFromWhitelist(accounts[4], { from: GOVERNOR_OWNER });
            expect(await this.supporters.isWhitelisted(accounts[1])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[4])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[5])).to.be.true;
        });

        it('should fail to check address zero', async () => {
            await expectRevert(
                this.supporters.isWhitelisted(constants.ZERO_ADDRESS),
                'Account must not be 0x0',
            );
        });

        it('should fail to add address zero', async () => {
            await expectRevert(
                this.supporters.addToWhitelist(constants.ZERO_ADDRESS, { from: GOVERNOR_OWNER }),
                'Account must not be 0x0',
            );
        });

        it('should fail to remove address zero', async () => {
            await expectRevert(
                this.supporters.removeFromWhitelist(constants.ZERO_ADDRESS, {
                    from: GOVERNOR_OWNER,
                }),
                'Account must not be 0x0',
            );
        });

        it('should fail if added twice', async () => {
            await this.supporters.addToWhitelist(accounts[4], { from: GOVERNOR_OWNER });
            await expectRevert(
                this.supporters.addToWhitelist(accounts[4], { from: GOVERNOR_OWNER }),
                'Account already whitelisted',
            );
        });

        // require(!isWhitelisted(account), "Account not allowed to add accounts into white list");

        it('iterate', async () => {
            await this.supporters.addToWhitelist(accounts[4], { from: GOVERNOR_OWNER });
            await this.supporters.addToWhitelist(accounts[5], { from: GOVERNOR_OWNER });
            await this.supporters.addToWhitelist(accounts[6], { from: GOVERNOR_OWNER });
            await this.supporters.addToWhitelist(accounts[7], { from: GOVERNOR_OWNER });
            expect(await this.supporters.getWhiteListLen()).to.be.bignumber.equal(new BN(4));
            expect(await this.supporters.getWhiteListAtIndex(0)).to.be.equal(accounts[4]);
            expect(await this.supporters.getWhiteListAtIndex(1)).to.be.equal(accounts[5]);
            expect(await this.supporters.getWhiteListAtIndex(2)).to.be.equal(accounts[6]);
            expect(await this.supporters.getWhiteListAtIndex(3)).to.be.equal(accounts[7]);
            await expectRevert(this.supporters.getWhiteListAtIndex(4), 'index out of bounds');
        });
    });

    describe('Governance', () => {
        beforeEach(async () => {
            this.governor = await helpers.createGovernor(GOVERNOR_OWNER);
            this.token = await TestMOC.new();
            await this.token.initialize(this.governor.address);
            this.supporters = await Supporters.new();
            await this.supporters.initialize(this.governor.address, [], this.token.address, period);
        });

        it('should fail in if not a governor call', async () => {
            await expectRevert(
                this.supporters.addToWhitelist(constants.ZERO_ADDRESS, { from: accounts[0] }),
                'not_authorized_changer',
            );
        });

        it('should set period', async () => {
            expect(await this.supporters.period()).to.be.bignumber.equal(new BN(10));
            const change = await artifacts
                .require('SupportersPeriodChange')
                .new(this.supporters.address, 123);
            await this.governor.execute(change);
            // await this.supporters.setPeriod(123, {from: GOVERNOR});
            expect(await this.supporters.period()).to.be.bignumber.equal(new BN(123));
        });
    });

    describe('Distribute', () => {
        const minCPSubscriptionStake = (10 ** 18).toString();
        const period = 3;
        const EARNINGS = new BN(web3.utils.toWei('1', 'ether'));
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

        it('Distribute should fail if contract not ready to distribute', async () => {
            let tokens = await this.staking.totalToken();
            expect(tokens, 'Initial token balance').to.be.bignumber.equal(new BN(0));

            let mocs = await this.staking.totalMoc();
            expect(mocs, 'Initial MOC balance').to.be.bignumber.equal(new BN(0));

            await this.token.transfer(this.supporters.address, EARNINGS, { from: accounts[2] });

            await expectRevert(
                this.supporters.distribute({ from: accounts[2] }),
                'Not ready to distribute',
            );
        });

        it('Distribute should succeed if contract is ready to distribute', async () => {
            await this.token.approve(this.staking.address, oracleData[0].stake, {
                from: oracleData[0].owner,
            });
            await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
                from: oracleData[0].owner,
            });

            let receipt = await this.supporters.distribute({ from: accounts[2] });
            const latestBlock = await helpers.getLatestBlock();

            expectEvent(receipt, 'PayEarnings', {
                earnings: EARNINGS,
                start: latestBlock,
                end: latestBlock.add(new BN(period)),
            });
        });
    });
});
