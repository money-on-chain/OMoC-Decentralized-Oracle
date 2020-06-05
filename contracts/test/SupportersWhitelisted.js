// Most of the functionallity is tested via Supporters.js !!!
const {BN, expectRevert, constants, expectEvent} = require("@openzeppelin/test-helpers")
const {expect} = require("chai")
const Supporters = artifacts.require("SupportersWhitelisted")
const TestMOC = artifacts.require("TestMOC")
const MockGovernor = artifacts.require("MockGovernor")
const helpers = require("./helpers")


contract('SupportersWhitelisted', (accounts) => {
    let supporters
    let token
    const minStayBlocks = 10
    const BALANCE_USER1 = new BN(web3.utils.toWei("1", "ether"))
    const BALANCE_USER2 = new BN(web3.utils.toWei("1", "ether"))
    const BALANCE_USER3 = new BN(web3.utils.toWei("1", "ether"))
    const BALANCE_PAYER = new BN(web3.utils.toWei("10", "ether"))

    const user1 = accounts[1]
    const user2 = accounts[2]
    const user3 = accounts[3]
    const payer = accounts[9]
    const GOVERNOR = accounts[8];
    describe('Creation', () => {
        beforeEach(async () => {
            token = await TestMOC.new()
            supporters = await Supporters.new()
            await supporters.initialize(GOVERNOR, [], token.address,
                new BN(10),  // period
                minStayBlocks
            )
        })

        it('check creation', async () => {
            assert.ok(supporters)
            const mocToken = await supporters.mocToken()
            assert.equal(mocToken, token.address, "MOC token address")
        })

        it('check initialization', async () => {
            const mocs = await supporters.getAvailableMOC()
            expect(mocs, "Available MOC").to.be.bignumber.equal(new BN(0))

            const tokens = await supporters.getTokens()
            expect(tokens, "Available tokens").to.be.bignumber.equal(new BN(0))
        })

        it('must fail for addresses that are not whitelisted', async () => {
            await expectRevert(supporters.stakeAt(BALANCE_USER1, user3, {from: user2}), "Address is not whitelisted");
            await expectRevert(supporters.withdrawFrom(BALANCE_USER1, user3, {from: user2}), "Address is not whitelisted");
        })
    })


    describe('Subaccounts', () => {
        const INITIAL_BALANCE = BALANCE_USER1.add(BALANCE_USER1)
        const EARNINGS = new BN(web3.utils.toWei("1", "ether"))
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS)

        beforeEach(async () => {
            token = await TestMOC.new()
            supporters = await Supporters.new()
            await supporters.initialize(GOVERNOR, [user1], token.address,
                new BN(10), // period
                minStayBlocks
            );

            await token.mint(user1, INITIAL_BALANCE)
            await token.mint(user2, BALANCE_USER2)
            await token.mint(user3, BALANCE_USER3)
            await token.mint(payer, BALANCE_PAYER)

            await token.approve(supporters.address, INITIAL_BALANCE, {from: user1})
        })

        it('stake', async () => {
            await supporters.stakeAt(BALANCE_USER1, user1, {from: user1})

            let tokens = await supporters.getBalanceAt(user1, user1)
            expect(tokens, "Initial user token balance").to.be.bignumber.equal(BALANCE_USER1)

            let mocs = await token.balanceOf(user1)
            expect(mocs, "Initial user MOC balance").to.be.bignumber.equal(BALANCE_USER1)

            await supporters.stakeAt(BALANCE_USER1, user3, {from: user1})

            tokens = await supporters.getBalanceAt(user1, user1)
            expect(tokens, "Final user token balance").to.be.bignumber.equal(BALANCE_USER1)

            tokens = await supporters.getBalanceAt(user3, user3)
            expect(tokens, "Final user token balance").to.be.bignumber.equal(new BN(0))

            tokens = await supporters.getBalanceAt(user1, user3)
            expect(tokens, "Final user token balance").to.be.bignumber.equal(BALANCE_USER1)

            tokens = await supporters.getBalanceAt(user3, user1)
            expect(tokens, "Final user token balance").to.be.bignumber.equal(new BN(0))

            mocs = await token.balanceOf(user1)
            expect(mocs, "Final user MOC balance").to.be.bignumber.equal(new BN(0))
        })

        it('withdraw', async () => {
            await supporters.stakeAt(BALANCE_USER1, user1, {from: user1})

            let tokens = await supporters.getBalanceAt(user1, user1)
            expect(tokens, "Initial user token balance").to.be.bignumber.equal(BALANCE_USER1)

            let mocs = await token.balanceOf(user1)
            expect(mocs, "Initial user MOC balance").to.be.bignumber.equal(BALANCE_USER1)

            await supporters.stakeAt(BALANCE_USER1, user3, {from: user1})

            // stop oracle as supporter
            await expectRevert(supporters.withdrawFrom(BALANCE_USER1, user1, {from: user1}), "Must be stopped");
            let receipt = await supporters.stop(user1, {from: user1});
            expectEvent(receipt, 'Stop')
            await helpers.mineBlocks(minStayBlocks);

            await supporters.withdrawFrom(BALANCE_USER1, user1, {from: user1})

            tokens = await supporters.getBalanceAt(user1, user1)
            expect(tokens, "User token balance").to.be.bignumber.equal(new BN(0))

            tokens = await supporters.getBalanceAt(user1, user3)
            expect(tokens, "User subaccount token balance").to.be.bignumber.equal(BALANCE_USER1)

            // stop oracle as supporter
            await expectRevert(supporters.withdrawFrom(BALANCE_USER1, user3, {from: user1}), "Must be stopped");
            receipt = await supporters.stop(user3, {from: user1});
            expectEvent(receipt, 'Stop')
            await helpers.mineBlocks(minStayBlocks);

            await supporters.withdrawFrom(BALANCE_USER1, user3, {from: user1})

            tokens = await supporters.getBalanceAt(user1, user3)
            expect(tokens, "Final user subaccount token balance").to.be.bignumber.equal(new BN(0))

            mocs = await token.balanceOf(user1)
            expect(mocs, "Final user MOC balance").to.be.bignumber.equal(INITIAL_BALANCE)
        });
    });

    describe('IterableWhiteList', () => {
        beforeEach(async () => {
            this.governor = await MockGovernor.new(GOVERNOR);
            this.token = await TestMOC.new();
            this.supporters = await Supporters.new();
            await this.supporters.initialize(this.governor.address, [], this.token.address,
                new BN(10), // period
                minStayBlocks
            );
        });


        it('add and remove', async () => {
            await this.supporters.addToWhitelist(accounts[4], {from: GOVERNOR});
            await this.supporters.addToWhitelist(accounts[5], {from: GOVERNOR});
            expect(await this.supporters.isWhitelisted(accounts[1])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[4])).to.be.true;
            expect(await this.supporters.isWhitelisted(accounts[5])).to.be.true;
            await this.supporters.removeFromWhitelist(accounts[4], {from: GOVERNOR});
            expect(await this.supporters.isWhitelisted(accounts[1])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[4])).to.be.false;
            expect(await this.supporters.isWhitelisted(accounts[5])).to.be.true;
        });

        it('should fail to check address zero', async () => {
            await expectRevert(
                this.supporters.isWhitelisted(constants.ZERO_ADDRESS),
                "Account must not be 0x0"
            );
        });

        it('should fail to add address zero', async () => {
            await expectRevert(
                this.supporters.addToWhitelist(constants.ZERO_ADDRESS, {from: GOVERNOR}),
                "Account must not be 0x0"
            )
        });

        it('should fail to remove address zero', async () => {
            await expectRevert(
                this.supporters.removeFromWhitelist(constants.ZERO_ADDRESS, {from: GOVERNOR}),
                "Account must not be 0x0"
            );
        });

        it('should fail if added twice', async () => {
            await this.supporters.addToWhitelist(accounts[4], {from: GOVERNOR});
            await expectRevert(
                this.supporters.addToWhitelist(accounts[4], {from: GOVERNOR}),
                "Account not allowed to add accounts into white list"
            );
        });

        // require(!isWhitelisted(account), "Account not allowed to add accounts into white list");

        it('iterate', async () => {
            await this.supporters.addToWhitelist(accounts[4], {from: GOVERNOR});
            await this.supporters.addToWhitelist(accounts[5], {from: GOVERNOR});
            await this.supporters.addToWhitelist(accounts[6], {from: GOVERNOR});
            await this.supporters.addToWhitelist(accounts[7], {from: GOVERNOR});
            expect(await this.supporters.getWhiteListLen()).to.be.bignumber.equal(new BN(4));
            expect(await this.supporters.getWhiteListAtIndex(0)).to.be.equal(accounts[4]);
            expect(await this.supporters.getWhiteListAtIndex(1)).to.be.equal(accounts[5]);
            expect(await this.supporters.getWhiteListAtIndex(2)).to.be.equal(accounts[6]);
            expect(await this.supporters.getWhiteListAtIndex(3)).to.be.equal(accounts[7]);
            await expectRevert(
                this.supporters.getWhiteListAtIndex(4),
                "Illegal index"
            );
        });
    });


    describe('Governance', () => {
        beforeEach(async () => {
            this.governor = await MockGovernor.new(GOVERNOR);
            this.token = await TestMOC.new();
            this.supporters = await Supporters.new();
            await this.supporters.initialize(this.governor.address, [], this.token.address,
                new BN(10), // period
                minStayBlocks
            );
        });

        it('should fail in if not a governor call', async () => {
            await expectRevert(
                this.supporters.addToWhitelist(constants.ZERO_ADDRESS, {from: accounts[0]}),
                "Invalid changer"
            )
        });

        it('should set period', async () => {
            expect(await this.supporters.period()).to.be.bignumber.equal(new BN(10))
            await this.supporters.setPeriod(123, {from: GOVERNOR});
            expect(await this.supporters.period()).to.be.bignumber.equal(new BN(123))
        });
    })
})
