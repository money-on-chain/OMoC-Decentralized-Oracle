// Most of the functionallity is tested via Supporters.js !!!

const {BN, expectRevert} = require("@openzeppelin/test-helpers")
const {expect} = require("chai")
const helpers = require("./helpers")

const Supporters = artifacts.require("SupportersWhitelisted")
const TestMOC = artifacts.require("TestMOC")


contract('SupportersWhitelisted', (accounts) => {
    let supporters
    let token

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
            await supporters.initialize(GOVERNOR, [], token.address, new BN(10))
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
            await supporters.initialize(GOVERNOR, [user1], token.address, new BN(10))

            await token.mint(user1, INITIAL_BALANCE)
            await token.mint(user2, BALANCE_USER2)
            await token.mint(user3, BALANCE_USER3)
            await token.mint(payer, BALANCE_PAYER)

            await token.approve(supporters.address, INITIAL_BALANCE, {from: user1})
        })

        it('stake', async () => {
            await supporters.stakeAt(BALANCE_USER1, user1, {from: user1})

            let tokens = await supporters.getBalance(user1)
            expect(tokens, "Initial user token balance").to.be.bignumber.equal(BALANCE_USER1)

            let mocs = await token.balanceOf(user1)
            expect(mocs, "Initial user MOC balance").to.be.bignumber.equal(BALANCE_USER1)

            await supporters.stakeAt(BALANCE_USER1, user3, {from: user1})

            tokens = await supporters.getBalance(user1)
            expect(tokens, "Final user token balance").to.be.bignumber.equal(BALANCE_USER1)

            tokens = await supporters.getBalance(user3)
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

            let tokens = await supporters.getBalance(user1)
            expect(tokens, "Initial user token balance").to.be.bignumber.equal(BALANCE_USER1)

            let mocs = await token.balanceOf(user1)
            expect(mocs, "Initial user MOC balance").to.be.bignumber.equal(BALANCE_USER1)

            await supporters.stakeAt(BALANCE_USER1, user3, {from: user1})

            await supporters.withdrawFrom(BALANCE_USER1, user1, {from: user1})

            tokens = await supporters.getBalance(user1)
            expect(tokens, "User token balance").to.be.bignumber.equal(new BN(0))

            tokens = await supporters.getBalanceAt(user1, user3)
            expect(tokens, "User subaccount token balance").to.be.bignumber.equal(BALANCE_USER1)

            await supporters.withdrawFrom(BALANCE_USER1, user3, {from: user1})

            tokens = await supporters.getBalanceAt(user1, user3)
            expect(tokens, "Final user subaccount token balance").to.be.bignumber.equal(new BN(0))

            mocs = await token.balanceOf(user1)
            expect(mocs, "Final user MOC balance").to.be.bignumber.equal(INITIAL_BALANCE)
        })
    })
})
