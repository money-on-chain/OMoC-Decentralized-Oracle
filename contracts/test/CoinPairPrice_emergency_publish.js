OracleManager = artifacts.require("OracleManager");
const CoinPairPrice = artifacts.require("CoinPairPrice");
const helpers = require('./helpers');
const TestMOC = artifacts.require("TestMOC");
const SupportersWhitelisted = artifacts.require("SupportersWhitelisted");
const CoinPairEmergencyWhitelistChange = artifacts.require("CoinPairEmergencyWhitelistChange");
const {expect} = require("chai")
const {expectRevert, BN} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract("[ @skip-on-coverage ] CoinPairPrice Emergency Publish", async (accounts) => {
    const EMERGENCY_PUBLISHER = accounts[2];
    const coin_pair = web3.utils.asciiToHex("BTCUSD");
    const minOracleOwnerStake = (1 * 10 ** 18).toString();
    const period = 20;
    const minStayBlocks = 10;
    const afterStopBlocks = 5;
    const feeSourceAccount = accounts[0];
    const maxOraclesPerRound = 2;
    const roundLockPeriodInBlocks = 5;
    const validPricePeriodInBlocks = 30;
    const emergencyPublishingPeriodInBlocks = 20;
    const bootstrapPrice = new BN("100000000");
    const numIdleRounds = 2;

    before(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        await this.token.initialize(this.governor.address);

        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();

        this.coinPairPrice = await CoinPairPrice.new();

        await this.coinPairPrice.initialize(
            this.governor.addr,
            [accounts[0]], // peek whitelist
            coin_pair,
            this.token.address,
            maxOraclesPerRound,
            roundLockPeriodInBlocks,
            validPricePeriodInBlocks,
            emergencyPublishingPeriodInBlocks,
            bootstrapPrice,
            numIdleRounds,
            this.oracleMgr.address);

        await this.supporters.initialize(this.governor.addr, [this.oracleMgr.address], this.token.address,
            period, minStayBlocks, afterStopBlocks);

        await this.oracleMgr.initialize(this.governor.addr, minOracleOwnerStake, this.supporters.address);
        // Create sample coin pairs
        await this.governor.registerCoinPair(this.oracleMgr, coin_pair, this.coinPairPrice.address);

        const change = await CoinPairEmergencyWhitelistChange.new(this.coinPairPrice.address, EMERGENCY_PUBLISHER);
        await this.governor.execute(change);
    });


    it("Should fail to emergency publish if not whitelisted", async () => {
        const NOT_A_PUBLISHED = accounts[1];
        assert.notEqual(EMERGENCY_PUBLISHER, NOT_A_PUBLISHED);

        await expectRevert(this.coinPairPrice.emergencyPublish(1234, {from: NOT_A_PUBLISHED}), "Address is not whitelisted");
    });

    it("Should fail to publish a zero price", async () => {
        await expectRevert(this.coinPairPrice.emergencyPublish(0, {from: EMERGENCY_PUBLISHER}), "Price must be positive and non-zero");
    });

    it("Should fail to publish before emergencyPublishingPeriodInBlocks", async () => {
        await expectRevert(this.coinPairPrice.emergencyPublish(1234, {from: EMERGENCY_PUBLISHER}), "Emergency publish period didn't started");
    });

    it("Should success to emergency publish after emergencyPublishingPeriodInBlocks blocks", async () => {
        const TO_PUBLISH = "1460";
        const prev = await this.coinPairPrice.peek();
        expect(prev[1], "valid").to.be.true;

        await helpers.mineBlocks(emergencyPublishingPeriodInBlocks);
        await this.coinPairPrice.emergencyPublish(TO_PUBLISH, {from: EMERGENCY_PUBLISHER});
        const post = await this.coinPairPrice.peek();
        assert.notEqual(prev, post);
        expect(post[1], "valid").to.be.true;
        expect(web3.utils.toBN(post[0]), "Price After").to.be.bignumber.equal(new BN(TO_PUBLISH))
    });

    it("Should success to emergency publish after a regular publication and emergencyPublishingPeriodInBlocks blocks", async () => {
        // Register Oracle
        const ORACLE_OWNER = accounts[0];
        const ORACLE_ADDR = accounts[1];
        await this.governor.mint(this.token.address, ORACLE_OWNER, '800000000000000000000');
        await this.token.approve(this.oracleMgr.address, minOracleOwnerStake, {from: ORACLE_OWNER});
        await this.oracleMgr.registerOracle(ORACLE_ADDR, "SOME_NAME", minOracleOwnerStake, {from: ORACLE_OWNER});
        await this.oracleMgr.subscribeCoinPair(ORACLE_ADDR, coin_pair, {from: ORACLE_OWNER});
        await this.coinPairPrice.switchRound();

        // Publish a price
        const thisCoinPair = await this.coinPairPrice.coinPair();
        const lastPubBlock = (await this.coinPairPrice.lastPublicationBlock()).toString();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(3, helpers.coinPairStr(thisCoinPair),
            "1233547895", ORACLE_ADDR, lastPubBlock);
        const signature = ethers.utils.splitSignature(await web3.eth.sign(encMsg, ORACLE_ADDR));
        await this.coinPairPrice.publishPrice(msg.version, thisCoinPair, msg.price,
            msg.votedOracle, msg.blockNumber, [signature.v], [signature.r], [signature.s], {from: ORACLE_ADDR});

        // fail
        await expectRevert(this.coinPairPrice.emergencyPublish(1234, {from: EMERGENCY_PUBLISHER}), "Emergency publish period didn't started");

        // success
        const TO_PUBLISH = "1460";
        const prev = await this.coinPairPrice.peek();
        expect(prev[1], "valid").to.be.true;
        await helpers.mineBlocks(emergencyPublishingPeriodInBlocks);
        await this.coinPairPrice.emergencyPublish(TO_PUBLISH, {from: EMERGENCY_PUBLISHER});
        const post = await this.coinPairPrice.peek();
        assert.notEqual(prev, post);
        expect(post[1], "valid").to.be.true;
        expect(web3.utils.toBN(post[0]), "Price After").to.be.bignumber.equal(new BN(TO_PUBLISH))
    });

})