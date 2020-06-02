// Most of the functionallity is tested via vested.js !!!

const {BN, expectRevert, expectEvent} = require("@openzeppelin/test-helpers")
const {expect} = require("chai")
const helpers = require("./helpers")

const SupportersVested = artifacts.require("SupportersVested")
const SupportersWhitelisted = artifacts.require("SupportersWhitelisted")
const TestMOC = artifacts.require("TestMOC")


contract('SupportersVested', (accounts) => {
    let whitelisted
    let vested
    let token

    const ZERO = new BN(0);
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
            vested = await SupportersVested.new()
            whitelisted = await SupportersWhitelisted.new()
            await whitelisted.initialize(GOVERNOR, [vested.address], token.address, new BN(10))

            await vested.initialize(
                GOVERNOR,
                whitelisted.address,    // _supporters
                new BN(3)               // _minStayBlocks
            )
        })

        it('check creation', async () => {
            assert.ok(vested)
            const wMocToken = await whitelisted.mocToken()
            assert.equal(wMocToken, token.address, "wMOC token address")
            const vMocToken = await vested.mocToken()
            assert.equal(vMocToken, token.address, "vMOC token address")
        })
    })

    describe('Operate', () => {
        const INITIAL_BALANCE = BALANCE_USER1
        const EARNINGS = new BN(web3.utils.toWei("1", "ether"))
        const FINAL_BALANCE = INITIAL_BALANCE.add(EARNINGS)

        beforeEach(async () => {
            token = await TestMOC.new()
            vested = await SupportersVested.new()
            whitelisted = await SupportersWhitelisted.new()
            await whitelisted.initialize(GOVERNOR, [vested.address], token.address, new BN(10))
            await vested.initialize(
                GOVERNOR,
                whitelisted.address,   // _supporters
                new BN(5)              // _minStayBlocks
            )

            await token.mint(user1, BALANCE_USER1)
            await token.mint(payer, BALANCE_PAYER)

            await token.approve(vested.address, BALANCE_USER1, {from: user1})
        })


        it('check minted tokens & approvals', async () => {
            const balance1 = await token.balanceOf(user1)
            expect(balance1, "Balance user1").to.be.bignumber.equal(BALANCE_USER1)

            const allowance1 = await token.allowance(user1, vested.address)
            expect(allowance1, "Allowance user1").to.be.bignumber.equal(BALANCE_USER1)
        })

        it('deposit earnings', async () => {
            let mocs = await vested.balanceOf(user1)
            expect(mocs, "Initial MOC balance").to.be.bignumber.equal(ZERO)

            await token.transfer(vested.address, EARNINGS, {from: payer})

            await expectRevert(
                vested.distribute({from: payer}),
                "Not ready to distribute"
            )

            mocs = await vested.balanceOf(user1)
            expect(mocs, "Final MOC balance").to.be.bignumber.equal(ZERO)

            mocs = await token.balanceOf(vested.address)
            expect(mocs, "Final MOC balance").to.be.bignumber.equal(EARNINGS)
        })

        async function do_the_rest() {

            // Not ready to distribute because there is no staked mocs
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")
            await vested.addStake(BALANCE_USER1, {from: user1})

            // The first distribute always succeeds
            await vested.distribute({from: payer})
            // Not ready to distribute the round is open.
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")

            await helpers.mineBlocks(10)
            await vested.distribute({from: payer})

            let receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')

            let mocs = await vested.balanceOf(user1)
            expect(mocs, "Final MOC balance after stop").to.be.bignumber.equal(FINAL_BALANCE)

            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStayBlocks")

            await helpers.mineBlocks(5)

            receipt = await vested.withdraw({from: user1})
            expectEvent(receipt, 'Withdraw')

            mocs = await vested.balanceOf(user1)
            expect(mocs, "Final vested MOC balance after withdraw").to.be.bignumber.equal(ZERO)

            mocs = await token.balanceOf(user1)
            expect(mocs, "Final MOC balance after withdraw").to.be.bignumber.equal(FINAL_BALANCE)
        }

        it('addStake, stop and withdraw from vested', async () => {
            let mocs = await vested.balanceOf(user1)
            expect(mocs, "Initial MOC balance").to.be.bignumber.equal(ZERO)

            await token.transfer(vested.address, EARNINGS, {from: payer})
            await do_the_rest()
        })

        it('addStake, stop and withdraw from whitelisted', async () => {
            let mocs = await vested.balanceOf(user1)
            expect(mocs, "Initial MOC balance").to.be.bignumber.equal(ZERO)

            await token.transfer(whitelisted.address, EARNINGS, {from: payer})
            await do_the_rest()
        })
    })

    describe('stake', () => {
        const BALANCE_USER1 = new BN(web3.utils.toWei("1", "ether"))

        beforeEach(async () => {
            token = await TestMOC.new()
            vested = await SupportersVested.new()
            whitelisted = await SupportersWhitelisted.new()
            await whitelisted.initialize(GOVERNOR, [vested.address], token.address, new BN(10))
            await vested.initialize(
                GOVERNOR,
                whitelisted.address,   // _supporters
                new BN(5)              // _minStayBlocks
            )
            await token.mint(user1, BALANCE_USER1)
        })


        it('check minted tokens & approvals', async () => {
            expect(await token.balanceOf(user1), "Balance user1").to.be.bignumber.equal(BALANCE_USER1)
            expect(await token.allowance(user1, vested.address), "Allowance").to.be.bignumber.equal(ZERO)
            expect(await token.allowance(user1, whitelisted.address), "Allowance").to.be.bignumber.equal(ZERO)
        })

        async function do_the_stake(contract_addr, success_call, fail_call) {
            expect(await vested.balanceOf(user1), "Initial MOC balance")
                .to.be.bignumber.equal(ZERO)

            await token.approve(contract_addr, BALANCE_USER1, {from: user1})
            expect(await token.allowance(user1, contract_addr), "Allowance")
                .to.be.bignumber.equal(BALANCE_USER1)

            await expectRevert(fail_call(BALANCE_USER1, user1), "transfer amount exceeds allowance")
            await success_call(BALANCE_USER1, user1)

            expect(await vested.balanceOf(user1), "Final balance").to.be.bignumber.equal(BALANCE_USER1)

            await expectRevert(vested.withdraw({from: user1}), "Must be stopped")

            expectEvent(await vested.stop({from: user1}), 'Stop')
            expect(await vested.balanceOf(user1), "Final MOC balance after stop").to.be.bignumber.equal(BALANCE_USER1)

            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStayBlocks")

            await helpers.mineBlocks(5)
            expectEvent(await vested.withdraw({from: user1}), 'Withdraw')

            expect(await vested.balanceOf(user1), "Final vested MOC balance after withdraw").to.be.bignumber.equal(ZERO)
            expect(await token.balanceOf(user1), "Final MOC balance after withdraw").to.be.bignumber.equal(BALANCE_USER1)
        }

        it('if approve is for whitelisted address then we can stakeDirectly', async () => {
            //
            const whitelisted_addr = await vested.supporters.call()
            expect(whitelisted_addr == whitelisted.address)
            await do_the_stake(whitelisted_addr,
                async (balance, user) => await vested.stakeDirectly(balance, {from: user}),
                async (balance, user) => await vested.addStake(balance, {from: user})
            );
        })

        it('if approve is for vested address then we must addStake', async () => {
            await do_the_stake(vested.address,
                async (balance, user) => await vested.addStake(balance, {from: user}),
                async (balance, user) => await vested.stakeDirectly(balance, {from: user}),
            );
        })

    })
})
