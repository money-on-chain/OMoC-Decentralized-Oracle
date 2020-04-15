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
                new BN(3),             // _minStayBlocks
                new BN(5)              // _minStopBlocks
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
                new BN(20),            // _minStayBlocks
                new BN(5)              // _minStopBlocks
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

            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")

            await vested.addStake(BALANCE_USER1, {from: user1})

            await helpers.mineBlocks(2)

            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await expectRevert(vested.withdraw({from: user1}), "Must be stop")
            await expectRevert(vested.reStake({from: user1}), "Must be stop")

            await vested.distribute({from: payer})

            await helpers.mineBlocks(10)
            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await helpers.mineBlocks(10)

            let receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')

            mocs = await vested.balanceOf(user1)
            expect(mocs, "Final MOC balance after stop").to.be.bignumber.equal(FINAL_BALANCE)

            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStopBlocks")

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

    async function checkBalances(balances) {
        const balance1 = await token.balanceOf(user1)
        expect(balance1, "Balance user1").to.be.bignumber.equal(balances.token)
        const detailedBalance = await vested.detailedBalanceOf(user1);
        expect(detailedBalance.staked, "Detailed staked Balance user1").to.be.bignumber.equal(balances.staked)
        expect(detailedBalance.stopped, "Detailed stopped Balance user1").to.be.bignumber.equal(balances.stopped)
    }

    describe('User can have part staked and part stopped, first history', () => {
        const EARNINGS = new BN(web3.utils.toWei("3", "ether"))
        let receipt;

        before(async () => {
            token = await TestMOC.new()
            vested = await SupportersVested.new()
            whitelisted = await SupportersWhitelisted.new()
            await whitelisted.initialize(GOVERNOR, [vested.address], token.address, new BN(10))
            await vested.initialize(
                GOVERNOR,
                whitelisted.address,   // _supporters
                new BN(20),            // _minStayBlocks
                new BN(30)              // _minStopBlocks
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
            await checkBalances({
                token: BALANCE_USER1,
                staked: ZERO,
                stopped: ZERO
            })
        })

        it('add earnings', async () => {
            await token.transfer(vested.address, EARNINGS, {from: payer})
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")
        })

        it('add stake', async () => {
            receipt = await vested.addStake(BALANCE_USER1.divn(4), {from: user1})
            expectEvent(receipt, 'AddStake')
            receipt = await vested.addStake(BALANCE_USER1.divn(4), {from: user1})
            expectEvent(receipt, 'AddStake')
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: BALANCE_USER1.divn(2),
                stopped: ZERO
            })
        })

        it('distribute earnings', async () => {
            await vested.distribute({from: payer})
            await helpers.mineBlocks(10)
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: BALANCE_USER1.divn(2).add(EARNINGS),
                stopped: ZERO
            })
        })

        it('stop', async () => {
            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await helpers.mineBlocks(20)
            receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: ZERO,
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('add more earnings', async () => {
            await token.transfer(vested.address, EARNINGS, {from: payer})
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")
        })

        it('add more stake', async () => {
            receipt = await vested.addStake(BALANCE_USER1.divn(2), {from: user1})
            expectEvent(receipt, 'AddStake')
            await checkBalances({
                token: ZERO,
                staked: BALANCE_USER1.divn(2),
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('distribute earnings', async () => {
            await vested.distribute({from: payer})
            await helpers.mineBlocks(10)
            await checkBalances({
                token: ZERO,
                staked: BALANCE_USER1.divn(2).add(EARNINGS),
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('stop again', async () => {
            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await helpers.mineBlocks(20)
            receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')
            await checkBalances({
                token: ZERO,
                staked: ZERO,
                stopped: BALANCE_USER1.add(EARNINGS).add(EARNINGS)
            })
        })

        it('withdraw', async () => {
            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStopBlocks")
            await helpers.mineBlocks(30)
            receipt = await vested.withdraw({from: user1})
            expectEvent(receipt, 'Withdraw')

            await checkBalances({
                token: BALANCE_USER1.add(EARNINGS).add(EARNINGS),
                staked: ZERO,
                stopped: ZERO
            })
        })
    })

    describe('User can have part staked and part stopped, second history', () => {
        const EARNINGS = new BN(web3.utils.toWei("3", "ether"))
        let receipt;

        before(async () => {
            token = await TestMOC.new()
            vested = await SupportersVested.new()
            whitelisted = await SupportersWhitelisted.new()
            await whitelisted.initialize(GOVERNOR, [vested.address], token.address, new BN(10))
            await vested.initialize(
                GOVERNOR,
                whitelisted.address,   // _supporters
                new BN(20),            // _minStayBlocks
                new BN(30)              // _minStopBlocks
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
            await checkBalances({
                token: BALANCE_USER1,
                staked: ZERO,
                stopped: ZERO
            })
        })

        it('add earnings', async () => {
            await token.transfer(vested.address, EARNINGS, {from: payer})
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")
        })

        it('add stake', async () => {
            receipt = await vested.addStake(BALANCE_USER1.divn(4), {from: user1})
            expectEvent(receipt, 'AddStake')
            receipt = await vested.addStake(BALANCE_USER1.divn(4), {from: user1})
            expectEvent(receipt, 'AddStake')
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: BALANCE_USER1.divn(2),
                stopped: ZERO
            })
        })

        it('distribute earnings', async () => {
            await vested.distribute({from: payer})
            await helpers.mineBlocks(10)
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: BALANCE_USER1.divn(2).add(EARNINGS),
                stopped: ZERO
            })
        })

        it('stop', async () => {
            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await helpers.mineBlocks(20)
            receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')
            await checkBalances({
                token: BALANCE_USER1.divn(2),
                staked: ZERO,
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('add more earnings', async () => {
            await token.transfer(vested.address, EARNINGS, {from: payer})
            await expectRevert(vested.distribute({from: payer}), "Not ready to distribute")
        })

        it('add more stake', async () => {
            receipt = await vested.addStake(BALANCE_USER1.divn(2), {from: user1})
            expectEvent(receipt, 'AddStake')
            await checkBalances({
                token: ZERO,
                staked: BALANCE_USER1.divn(2),
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('distribute earnings', async () => {
            await vested.distribute({from: payer})
            await helpers.mineBlocks(10)
            await checkBalances({
                token: ZERO,
                staked: BALANCE_USER1.divn(2).add(EARNINGS),
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('withdraw', async () => {
            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStopBlocks")
            await helpers.mineBlocks(30)
            receipt = await vested.withdraw({from: user1})
            expectEvent(receipt, 'Withdraw')

            await checkBalances({
                token: BALANCE_USER1.divn(2).add(EARNINGS),
                staked: BALANCE_USER1.divn(2).add(EARNINGS),
                stopped: ZERO
            })
        })

        it('stop again', async () => {
            await expectRevert(vested.stop({from: user1}), "Can't stop until minStayBlocks")
            await helpers.mineBlocks(20)
            receipt = await vested.stop({from: user1})
            expectEvent(receipt, 'Stop')
            await checkBalances({
                token: BALANCE_USER1.divn(2).add(EARNINGS),
                staked: ZERO,
                stopped: BALANCE_USER1.divn(2).add(EARNINGS)
            })
        })

        it('withdraw again', async () => {
            await expectRevert(vested.withdraw({from: user1}), "Can't withdraw until minStopBlocks")
            await helpers.mineBlocks(30)
            receipt = await vested.withdraw({from: user1})
            expectEvent(receipt, 'Withdraw')

            await checkBalances({
                token: BALANCE_USER1.add(EARNINGS).add(EARNINGS),
                staked: ZERO,
                stopped: ZERO
            })
        })

    })


})
