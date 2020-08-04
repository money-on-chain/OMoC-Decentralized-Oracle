const OracleManager = artifacts.require("OracleManager");
const CoinPairPrice = artifacts.require("CoinPairPrice");
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers')
const helpers = require('./helpers');
const ethers = require('ethers');
const crypto = require("crypto");
const TestMOC = artifacts.require("TestMOC");
const SupportersWhitelisted = artifacts.require("SupportersWhitelisted");

const ORACLE_QUANTITY = 21;
const COINPAIR = web3.utils.asciiToHex("BTCUSD");
const minOracleOwnerStake = 10000000000;
const minStayBlocks = 10;
const maxOraclesPerRound = 10;

contract("[ @skip-on-coverage ] CoinPairPrice Subscribe", async (accounts) => {

    async function register(token, oracleManager, ownerAddr, stake, name, oracleAddr) {
        const initialBalance = await token.balanceOf(ownerAddr);
        await token.approve(oracleManager.address, stake, {from: ownerAddr});
        await oracleManager.registerOracle(oracleAddr, name, stake, {from: ownerAddr});
        const info = await oracleManager.getOracleRegistrationInfo(oracleAddr);
        assert.equal(info.internetName, name);
        assert.equal(info.stake, stake);
        assert.equal((await token.balanceOf(ownerAddr)).toString(), initialBalance.sub(new BN(stake)).toString());

    }

    async function init_contracts(testobj) {
        testobj.governor = await helpers.createGovernor(accounts[8]);
        testobj.token = await TestMOC.new();
        await testobj.token.initialize(testobj.governor.address);
        testobj.oracleMgr = await OracleManager.new();
        testobj.supporters = await SupportersWhitelisted.new();
        testobj.coinPairPrice = await CoinPairPrice.new();
        await testobj.coinPairPrice.initialize(
            testobj.governor.addr,
            [accounts[0]],
            COINPAIR,
            testobj.token.address,
            maxOraclesPerRound,
            5, // roundLockPeriodInBlocks,
            3, // validPricePeriodInBlocks
            2, // emergencyPublishingPeriodInBlocks
            1000000000000000, // bootstrapPrice,
            2, // numIdleRounds,
            testobj.oracleMgr.address);

        await testobj.supporters.initialize(testobj.governor.addr, [testobj.oracleMgr.address], testobj.token.address,
            new BN(10), // period
            new BN(5),  // _minStayBlocks
            new BN(2)   // _afterStopBlocks
        );
        await testobj.oracleMgr.initialize(testobj.governor.addr, minOracleOwnerStake, testobj.supporters.address);
        // Create sample coin pairs
        await testobj.governor.registerCoinPair(testobj.oracleMgr, COINPAIR, testobj.coinPairPrice.address);

        await testobj.governor.mint(testobj.token.address, accounts[0], '800000000000000000000');
        await testobj.governor.mint(testobj.token.address, accounts[2], '800000000000000000000');
        await testobj.governor.mint(testobj.token.address, accounts[4], '800000000000000000000');
        await testobj.governor.mint(testobj.token.address, accounts[6], '800000000000000000000');
        assert.equal(maxOraclesPerRound, (await testobj.coinPairPrice.maxOraclesPerRound()).toNumber());
        assert.equal((await testobj.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
        assert.equal((await testobj.coinPairPrice.getRoundInfo()).round, 0);
        const oracle_list = [];
        for (let i = 0; i < ORACLE_QUANTITY; i++) {
            const pass = crypto.randomBytes(20).toString('hex');
            const oracle_addr = await web3.eth.personal.newAccount(pass);
            await web3.eth.personal.unlockAccount(oracle_addr, pass, 6000);
            const acc = accounts[2 * (i % 4)]; //  accounts with MOCs: [0, 2, 4, 6]
            const stake = 10000000000 + i * 100000;
            const name = 'ORACLE-' + i;
            await register(testobj.token, testobj.oracleMgr, acc, stake, name, oracle_addr);
            oracle_list.push({oracle_addr, owner_addr: acc, stake});
        }
        return oracle_list;
    };


    describe("During round zero we don't add oracles on subscription", () => {
        let oracle_list;

        it("creation", async () => {
            oracle_list = await init_contracts(this);
        });

        it("Should subscribe oracleCant oracles and none goes to current round", async () => {
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            for (const {oracle_addr, owner_addr} of oracle_list) {
                await this.oracleMgr.subscribeToCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
                const subscribed = await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR);
                assert.isTrue(subscribed);
                assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            }
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            await this.coinPairPrice.switchRound();
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
        });
    });

    describe("During non zero we add oracles on subscription right away", () => {
        let oracle_list;
        let ORACLE_WITH_A_LOT_OF_STAKE;
        let ORACLE_WITH_SMALL_STAKE;

        it("creation", async () => {
            oracle_list = await init_contracts(this);
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            await this.coinPairPrice.switchRound();
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            ORACLE_WITH_A_LOT_OF_STAKE = oracle_list[ORACLE_QUANTITY - 1];
            ORACLE_WITH_SMALL_STAKE = oracle_list[2];
        });

        it("Should subscribe oracleCant oracles and the first maxOraclesPerRound goes to current round", async () => {
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
            for (const {oracle_addr, owner_addr} of oracle_list) {
                const cant_prev = (await this.coinPairPrice.getRoundInfo()).selectedOracles.length;

                await this.oracleMgr.subscribeToCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
                assert.isTrue(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));

                const cant_post = (await this.coinPairPrice.getRoundInfo()).selectedOracles.length;
                if (cant_prev < maxOraclesPerRound) {
                    assert.equal(cant_prev + 1, cant_post);
                } else {
                    assert.equal(maxOraclesPerRound, cant_post);
                }
            }
        });

        it("The oracles are added right away when we saturate the list the new ones even if have more stake must wait to next round", async () => {
            assert.isTrue(await this.oracleMgr.isSubscribed(ORACLE_WITH_SMALL_STAKE.oracle_addr, COINPAIR));
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(ORACLE_WITH_SMALL_STAKE.oracle_addr) >= 0);

            assert.isTrue(await this.oracleMgr.isSubscribed(ORACLE_WITH_A_LOT_OF_STAKE.oracle_addr, COINPAIR));
            assert.isFalse((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(ORACLE_WITH_A_LOT_OF_STAKE.oracle_addr) >= 0);
        });

        it("It is ok to unsubscribes and subscribes again in the same round", async () => {
            const {oracle_addr, owner_addr} = ORACLE_WITH_SMALL_STAKE;

            await this.oracleMgr.unsubscribeFromCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
            assert.isFalse(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            // Even after unsubscribe we are still in the round, is just a stop signal
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)

            await this.oracleMgr.subscribeToCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
            assert.isTrue(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
        });

        it("In the next round ORACLE_WITH_NO_STAKE loose his place", async () => {
            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
            assert.isTrue(await this.oracleMgr.isSubscribed(ORACLE_WITH_SMALL_STAKE.oracle_addr, COINPAIR));
            assert.isFalse((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(ORACLE_WITH_SMALL_STAKE.oracle_addr) >= 0);

            assert.isTrue(await this.oracleMgr.isSubscribed(ORACLE_WITH_A_LOT_OF_STAKE.oracle_addr, COINPAIR));
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(ORACLE_WITH_A_LOT_OF_STAKE.oracle_addr) >= 0);
        });

        it("If ORACLE_WITH_A_LOT_OF_STAKE unsubscribes then he looses its place in next round", async () => {
            const {oracle_addr, owner_addr} = ORACLE_WITH_A_LOT_OF_STAKE;
            assert.isTrue(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);

            await this.oracleMgr.unsubscribeFromCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
            assert.isFalse(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)

            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();

            // We are not in selected oracles anymore
            assert.isFalse((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);

            // Even if we subscribe we don't get in the new round
            await this.oracleMgr.subscribeToCoinPair(oracle_addr, COINPAIR, {from: owner_addr});
            assert.isTrue(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            assert.isFalse((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)

            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
            assert.isTrue(await this.oracleMgr.isSubscribed(oracle_addr, COINPAIR));
            assert.isTrue((await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracle_addr) >= 0);
            assert.equal(maxOraclesPerRound, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length)
        });
    });
});
