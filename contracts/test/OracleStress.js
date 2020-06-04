const OracleManager = artifacts.require("OracleManager");
const CoinPairPrice = artifacts.require("CoinPairPrice");
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers')
const helpers = require('./helpers');
const ethers = require('ethers');
const crypto = require("crypto");
const TestMOC = artifacts.require("TestMOC");
const SupportersWhitelisted = artifacts.require("SupportersWhitelisted");

const ORACLE_QUANTITY = 40;
const COINPAIR = web3.utils.asciiToHex("BTCUSD");
const minOracleOwnerStake = 10000000000;
const minStayBlocks = 10;
const maxOraclesPerRound = 10;

contract("[ @skip-on-coverage ] OracleStress", async (accounts) => {

    before(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();

        this.coinPairPrice = await CoinPairPrice.new();
        await this.coinPairPrice.initialize(
            this.governor.addr,
            [accounts[0]],
            COINPAIR,
            this.token.address,
            maxOraclesPerRound,
            5, // roundLockPeriodInBlocks,
            3, // validPricePeriodInBlocks
            1000000000000000, // bootstrapPrice,
            2, // numIdleRounds,
            this.oracleMgr.address);

        await this.supporters.initialize(this.governor.addr, [this.oracleMgr.address], this.token.address, new BN(5), minStayBlocks)
        await this.oracleMgr.initialize(this.governor.addr, minOracleOwnerStake, this.supporters.address);
        // Create sample coin pairs
        await this.governor.registerCoinPair(this.oracleMgr, COINPAIR, this.coinPairPrice.address);

        await this.token.mint(accounts[0], '800000000000000000000');
        await this.token.mint(accounts[2], '800000000000000000000');
        await this.token.mint(accounts[4], '800000000000000000000');
        await this.token.mint(accounts[6], '800000000000000000000');
    });

    async function register(coinPairPrice, token, oracleManager, ownerAddr, stake, name, oracleAddr, prevEntry) {
        const initialBalance = await token.balanceOf(ownerAddr);
        await token.approve(oracleManager.address, stake, {from: ownerAddr});
        await oracleManager.registerOracleWithHint(oracleAddr, name, stake, prevEntry, {from: ownerAddr});
        const info = await oracleManager.getOracleRegistrationInfo(oracleAddr);
        assert.equal(info.internetName, name);
        assert.equal(info.stake, stake);
        assert.equal((await token.balanceOf(ownerAddr)).toString(), initialBalance.sub(new BN(stake)).toString());
        const cant_prev = (await coinPairPrice.getRoundInfo()).selectedOracles.length
        await oracleManager.subscribeCoinPair(oracleAddr, COINPAIR, {from: ownerAddr});
        const subscribed = await oracleManager.isSubscribed(oracleAddr, COINPAIR);
        assert.isTrue(subscribed);

        const round_info = await coinPairPrice.getRoundInfo()
        if (round_info.round == 0) {
            // We can't detect if the oracle is inside the round, so we don't add them
        } else {
            // We add to selected oracles right away
            const cant_post = round_info.selectedOracles.length;
            if (cant_prev < maxOraclesPerRound) {
                assert.equal(cant_prev + 1, cant_post);
            } else {
                assert.equal(maxOraclesPerRound, cant_post);
            }
        }

    }

    it("creation", async () => {
        assert.equal(maxOraclesPerRound, (await this.coinPairPrice.maxOraclesPerRound()).toNumber());
        assert.equal((await this.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
        // This script tests the addition of oracles during registration
        // for that we must switch round zero
        await this.coinPairPrice.switchRound();
        assert.equal((await this.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
    });

    const oracleList = [];
    it("Get gas price", async () => {
        const gasPrice = await TestMOC.web3.eth.getGasPrice();
        console.log("Gas Price is ", gasPrice, " wei");
    });

    function getPrevEntries(oracles) {
        const ret = [];
        const sortedOracles = oracles.concat().sort((a, b) => (b.stake - a.stake));
        const oracleMap = oracles.reduce((acc, val, index) => {
            acc[val["account"]] = index;
            return acc;
        }, {});

        for (let i = 0; i < sortedOracles.length; i++) {
            const oracleData = sortedOracles[i];
            const idx = oracleMap[oracleData["account"]];
            ret[idx] = constants.ZERO_ADDRESS;
            if (i > 0) {
                ret[idx] = sortedOracles[i - 1]["account"];
            }
        }
        return ret;
    }

    it("Should register oraclesCant oracles", async () => {
        for (let i = 0; i < ORACLE_QUANTITY; i++) {
            // const account = web3.eth.accounts.create();
            // await web3.eth.accounts.wallet.add(oracle_account)
            const pass = crypto.randomBytes(20).toString('hex');
            const account = await web3.eth.personal.newAccount(pass);
            await web3.eth.personal.unlockAccount(account, pass, 6000);
            const acc = accounts[2 * (i % 4)]; //  accounts with MOCs: [0, 2, 4, 6]
            const stake = 10000000000 + Math.floor(Math.random() * 100000);
            const name = 'ORACLE-' + i;
            oracleList.push({
                name,
                stake,
                owner_account: acc,
                account,
                pass
            });
        }
        const inserted = [];
        for (let i = 0; i < oracleList.length; i++) {
            inserted.push(oracleList[i]);
            const prevEntry = getPrevEntries(inserted);
            await register(this.coinPairPrice, this.token, this.oracleMgr, inserted[i].owner_account, inserted[i].stake, inserted[i].name, inserted[i].account, prevEntry[i]);
        }
    });


    it("Should select the maxOraclesPerRound oracles", async () => {
        assert.equal((await this.coinPairPrice.getRoundInfo()).selectedOracles.length, maxOraclesPerRound);
        await this.coinPairPrice.switchRound();
        const selOraclesPos = (await this.coinPairPrice.getRoundInfo()).selectedOracles;
        const selected = oracleList.concat().sort((a, b) => (b.stake - a.stake)).map(x => x.account).slice(0, maxOraclesPerRound);
        assert.equal(selOraclesPos.length, selected.length);
        for (let i = 0; i < selOraclesPos.length; i++) {
            assert.equal(selOraclesPos[i], selected[i]);
        }
    });

    it("Should select the maxOraclesPerRound oracles after adding stake", async () => {
        for (let i = 0; i < oracleList.length; i++) {
            const removePrevEntry = getPrevEntries(oracleList)[i];
            const delta_stake = Math.floor(Math.random() * 1000000);
            oracleList[i]["delta_stake"] = delta_stake;
            oracleList[i].stake = oracleList[i].stake + delta_stake;
            const addPrevEntry = getPrevEntries(oracleList)[i];
            await this.token.approve(this.oracleMgr.address, oracleList[i].delta_stake, {from: oracleList[i].owner_account});

            await this.oracleMgr.addStakeWithHint(oracleList[i].account, oracleList[i].delta_stake, removePrevEntry, addPrevEntry, {from: oracleList[i].owner_account});
        }
        const maxOraclesPerRound = (await this.coinPairPrice.maxOraclesPerRound()).toNumber();
        await this.coinPairPrice.switchRound();
        const selOraclesPos = (await this.coinPairPrice.getRoundInfo()).selectedOracles;
        const selected = oracleList.concat().sort((a, b) => (b.stake - a.stake)).map(x => x.account).slice(0, maxOraclesPerRound);
        assert.equal(selOraclesPos.length, selected.length);
        for (let i = 0; i < selOraclesPos.length; i++) {
            assert.equal(selOraclesPos[i], selected[i]);
        }
    });

    it("Should get the right prev entry", async () => {
        const prevs = getPrevEntries(oracleList);
        const oracleMap = oracleList.reduce((acc, val, index) => {
            acc[val["account"]] = index;
            return acc;
        }, {});

        for (let i = 0; i < oracleList.length; i++) {
            const addr = oracleList[i]["account"];
            const stake = oracleList[i]["stake"];
            const p1 = await this.oracleMgr.getPrevByAddr(addr);
            assert.equal(prevs[i], p1);
            const p2 = await this.oracleMgr.getPrevByAddrWithHint(addr, prevs[i]);
            assert.equal(prevs[i], p2);
            const p3 = await this.oracleMgr.getPrevByStake(stake);
            // If I'm going to insert a new entry with the same stake
            // the current entry is going to be the previous one.
            assert.equal(addr, p3);
            const p4 = await this.oracleMgr.getPrevByStakeWithHint(stake, prevs[i]);
            assert.equal(addr, p4);
            const prevPrev = prevs[oracleMap[prevs[i]]];
            if (prevPrev) {
                const p5 = await this.oracleMgr.getPrevByAddrWithHint(addr, prevPrev);
                assert.equal(prevs[i], p5);
                const p6 = await this.oracleMgr.getPrevByStakeWithHint(stake, prevPrev);
                assert.equal(addr, p6);
                const prevPrevPrev = prevs[oracleMap[prevs[oracleMap[prevs[i]]]]];
                if (prevPrevPrev) {
                    const p7 = await this.oracleMgr.getPrevByAddrWithHint(addr, prevPrevPrev);
                    assert.equal(prevs[i], p7);
                    const p8 = await this.oracleMgr.getPrevByStakeWithHint(stake, prevPrevPrev);
                    assert.equal(addr, p8);
                }
            }
            const next = oracleList.find(x => x.stake < stake);
            if (next) {
                await expectRevert(this.oracleMgr.getPrevByStakeWithHint(stake, next["account"]), "Wrong prev entry stake")
                await expectRevert(this.oracleMgr.getPrevByAddrWithHint(addr, next["account"]), "Invalid prev entry")
                const nextNext = oracleList.find(x => x.stake < next["stake"]);
                if (nextNext) {
                    await expectRevert(this.oracleMgr.getPrevByStakeWithHint(stake, nextNext["account"]), "Wrong prev entry stake")
                    await expectRevert(this.oracleMgr.getPrevByAddrWithHint(addr, nextNext["account"]), "Invalid prev entry")
                }
            }
        }
    });


    it("Should publish a lot", async () => {
        const selAddreses = (await this.coinPairPrice.getRoundInfo()).selectedOracles;
        const maxOraclesPerRound = (await this.coinPairPrice.maxOraclesPerRound()).toNumber();
        assert.equal(selAddreses.length, maxOraclesPerRound);
        const selOracles = selAddreses.map(x => oracleList.find(y => x == y.account));
        for (let i = 0; i < selOracles.length; i++) {
            const o = selOracles[i];
            assert.ok(web3.eth.sendTransaction({
                from: o.owner_account,
                to: o.account,
                value: 2 * (10 ** 18)
            }), "Give some funds to oracle");
        }
        for (let k = 0; k < 10; k++) {
            for (let i = 0; i < selOracles.length; i++) {
                const o = selOracles[i]
                const lastPub = (await this.coinPairPrice.getLastPublicationBlock()).toString();
                const price = Math.floor(Math.random() * 1000000);
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(3, "BTCUSD", price.toString(), o.account, lastPub);
                const signatures = []
                for (let j = 0; j < selOracles.length / 2 + 2; j++) {
                    const account = selOracles[j].account;
                    if (account == o.account) {
                        continue
                    }
                    const signed = ethers.utils.splitSignature(await web3.eth.sign(encMsg, account));
                    signatures.push({account, signed});
                }
                const sortedData = signatures
                    .concat().sort((a, b) => ((new BN(a.account.slice(2), 16).cmp(new BN(b.account.slice(2), 16)))))
                    .map(x => x.signed)
                await this.coinPairPrice.publishPrice(msg.version, COINPAIR, msg.price, msg.votedOracle, lastPub,
                    sortedData.map(x => x.v),
                    sortedData.map(x => x.r),
                    sortedData.map(x => x.s),
                    {from: o.account});
            }
        }
    });

    it("Oracle list should be sorted correctly", async () => {
        const sortedAddrs = [];
        let it = await this.oracleMgr.getRegisteredOracleHead();
        while (it != constants.ZERO_ADDRESS) {
            sortedAddrs.push(it);
            it = await this.oracleMgr.getRegisteredOracleNext(it);
        }
        const sortedOraclesAddrs = oracleList.concat().sort((a, b) => (b.stake - a.stake)).map(x => x.account);
        assert.equal(sortedAddrs.length, sortedOraclesAddrs.length);
        for (let i = 0; i < sortedAddrs.length; i++) {
            assert.equal(sortedAddrs[i], sortedOraclesAddrs[i]);
        }
    });

    it("Should remove all oracles", async () => {
        for (let i = 0; i < oracleList.length; i++) {
            await this.oracleMgr.unsubscribeCoinPair(oracleList[i].account, COINPAIR, {from: oracleList[i].owner_account});
            const subscribed = await this.oracleMgr.isSubscribed(oracleList[i].account, COINPAIR);
            assert.isFalse(subscribed);
        }

        const numIdleRounds = (await this.coinPairPrice.numIdleRounds()).toNumber();
        for (let i = 0; i < numIdleRounds; i++) {
            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
        }

        const ol = oracleList.concat();
        while (ol.length != 0) {
            const idx = Math.floor(Math.random() * ol.length);
            const prevEntries = getPrevEntries(ol);

            const initialBalance = await this.token.balanceOf(ol[idx].owner_account);

            // stop oracle as supporter
            await expectRevert(this.oracleMgr.removeOracleWithHint(ol[idx].account, prevEntries[idx], {from: ol[idx].owner_account}), "Must be stopped");
            await this.oracleMgr.stop(ol[idx].account, {from: ol[idx].owner_account});
            await helpers.mineBlocks(minStayBlocks);

            await this.oracleMgr.removeOracleWithHint(ol[idx].account, prevEntries[idx], {from: ol[idx].owner_account});
            await expectRevert(this.oracleMgr.getOracleRegistrationInfo(ol[idx].account), "Oracle not registered")

            const currBalance = await this.token.balanceOf(ol[idx].owner_account);
            assert.equal(currBalance.toString(), initialBalance.add(new BN(ol[idx].stake)).toString());

            ol.splice(idx, 1);
        }
    });
});
