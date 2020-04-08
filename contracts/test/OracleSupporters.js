const OracleManager = artifacts.require("OracleManager");
const CoinPairPrice = artifacts.require("CoinPairPrice");
const helpers = require("./helpers");
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers')
const {expect} = require("chai")
const SupportersWhitelisted = artifacts.require("SupportersWhitelisted");
const TestMOC = artifacts.require("TestMOC");

contract("Oracle-Supporters integration", (accounts) => {
    const minOracleOwnerStake = 1
    const oracle1 = accounts[2]
    const oracle2 = accounts[3]
    const INITIAL_BALANCE = web3.utils.toWei(new BN(10), "ether")
    const STAKE = web3.utils.toWei(new BN(1), "ether")

    beforeEach(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();

        this.coinPairPrice = await CoinPairPrice.new();
        await this.coinPairPrice.initialize(
            this.governor.addr,
            [accounts[0]],
            web3.utils.asciiToHex("BTCUSD"),
            this.token.address,
            1, // maxOraclesPerRound,
            1, // roundLockPeriodInBlocks,
            0, // bootstrapPrice,
            1, // numIdleRounds,
            this.oracleMgr.address);

        await this.supporters.initialize(this.governor.addr, [this.oracleMgr.address], this.token.address, new BN(10))
        await this.oracleMgr.initialize(this.governor.addr, minOracleOwnerStake, this.supporters.address);
        // Create sample coin pairs
        await this.governor.registerCoinPair(this.oracleMgr, web3.utils.asciiToHex("BTCUSD"), this.coinPairPrice.address);

        await this.token.mint(oracle1, INITIAL_BALANCE)
        await this.token.mint(oracle2, INITIAL_BALANCE)

        await this.token.approve(this.oracleMgr.address, INITIAL_BALANCE, {from: oracle1})
        await this.token.approve(this.oracleMgr.address, INITIAL_BALANCE, {from: oracle2})
    })

    it("Stake", async () => {
        let balance
        let mocs

        await this.oracleMgr.registerOracle(oracle1, "oracle", STAKE, {from: oracle1});
        await this.oracleMgr.suscribeCoinPair(oracle1, web3.utils.asciiToHex("BTCUSD"), {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(STAKE)

        mocs = await this.token.balanceOf(oracle1)
        expect(mocs, "Oracle1 MOC balance").to.be.bignumber.equal(INITIAL_BALANCE.sub(STAKE))

        await this.oracleMgr.addStake(oracle1, STAKE, {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(STAKE.add(STAKE))

        mocs = await this.token.balanceOf(oracle1)
        expect(mocs, "Oracle1 MOC balance").to.be.bignumber.equal(INITIAL_BALANCE.sub(STAKE).sub(STAKE))
    })

    it("Withdraw", async () => {
        let balance;
        let mocs;

        mocs = await this.token.balanceOf(oracle1)
        expect(mocs, "Oracle1 MOC balance").to.be.bignumber.equal(INITIAL_BALANCE)

        await this.oracleMgr.registerOracle(oracle1, "oracle1", STAKE, {from: oracle1});
        await this.oracleMgr.suscribeCoinPair(oracle1, web3.utils.asciiToHex("BTCUSD"), {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(STAKE)

        mocs = await this.token.balanceOf(oracle1)
        expect(mocs, "Oracle1 MOC balance").to.be.bignumber.equal(INITIAL_BALANCE.sub(STAKE))

        await this.oracleMgr.addStake(oracle1, STAKE, {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(STAKE.add(STAKE))

        await this.oracleMgr.registerOracle(oracle2, "oracle2", STAKE, {from: oracle2});
        await this.oracleMgr.suscribeCoinPair(oracle2, web3.utils.asciiToHex("BTCUSD"), {from: oracle2});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle2)
        expect(balance, "Oracle2 token balance").to.be.bignumber.equal(STAKE)

        await this.oracleMgr.unsuscribeCoinPair(oracle1, web3.utils.asciiToHex("BTCUSD"), {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(STAKE.add(STAKE))

        await helpers.mineUntilNextRound(this.coinPairPrice)
        await this.coinPairPrice.switchRound();

        await helpers.mineUntilNextRound(this.coinPairPrice)
        await this.coinPairPrice.switchRound();

        await this.oracleMgr.removeOracle(oracle1, {from: oracle1});

        balance = await this.supporters.getBalanceAt(this.oracleMgr.address, oracle1)
        expect(balance, "Oracle1 token balance").to.be.bignumber.equal(new BN(0))

        mocs = await this.token.balanceOf(oracle1)
        expect(mocs, "Oracle1 MOC balance").to.be.bignumber.equal(INITIAL_BALANCE)
    })
})
