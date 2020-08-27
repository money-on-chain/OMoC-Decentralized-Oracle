const OracleManager = artifacts.require('OracleManager');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const crypto = require('crypto');
const TestMOC = artifacts.require('TestMOC');
const SupportersWhitelisted = artifacts.require('SupportersWhitelisted');

const COINPAIR = web3.utils.asciiToHex('BTCUSD');
const COINPAIR2 = web3.utils.asciiToHex('BTCRIF');
const minOracleOwnerStake = 10000;
const period = 20;
const maxOraclesPerRound = 10;
const maxSubscribedOraclesPerRound = 30;

contract('[ @slow ] [ @skip-on-coverage ] OracleStress2', async (accounts) => {
    before(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        await this.token.initialize(this.governor.address);
        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();

        this.coinPairPrice = await CoinPairPrice.new();
        await this.coinPairPrice.initialize(
            this.governor.addr,
            [accounts[0]],
            COINPAIR,
            this.token.address,
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            5, // roundLockPeriodInBlocks,
            3, // validPricePeriodInBlocks
            2, // emergencyPublishingPeriodInBlocks
            1000000000000000, // bootstrapPrice,
            this.oracleMgr.address,
        );

        this.coinPairPrice2 = await CoinPairPrice.new();
        await this.coinPairPrice2.initialize(
            this.governor.addr,
            [accounts[0]],
            COINPAIR2,
            this.token.address,
            maxOraclesPerRound,
            5, // roundLockPeriodInBlocks,
            3, // validPricePeriodInBlocks
            2, // emergencyPublishingPeriodInBlocks
            1000000000000000, // bootstrapPrice,
            this.oracleMgr.address,
        );

        await this.supporters.initialize(
            this.governor.addr,
            [this.oracleMgr.address],
            this.token.address,
            period,
        );

        await this.oracleMgr.initialize(
            this.governor.addr,
            minOracleOwnerStake,
            this.supporters.address,
        );
        // Create sample coin pairs
        await this.governor.registerCoinPair(this.oracleMgr, COINPAIR, this.coinPairPrice.address);
        await this.governor.registerCoinPair(
            this.oracleMgr,
            COINPAIR2,
            this.coinPairPrice2.address,
        );

        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
    });

    function getPrevEntries(oracles) {
        const ret = [];
        const sortedOracles = oracles.concat().sort((a, b) => b.stake - a.stake);
        const oracleMap = oracles.reduce((acc, val, index) => {
            acc[val['account']] = index;
            return acc;
        }, {});

        for (let i = 0; i < sortedOracles.length; i++) {
            const oracleData = sortedOracles[i];
            const idx = oracleMap[oracleData['account']];
            ret[idx] = constants.ZERO_ADDRESS;
            if (i > 0) {
                ret[idx] = sortedOracles[i - 1]['account'];
            }
        }
        return ret;
    }

    const inserted = [];
    it('Register 750 oracles in COINPAIR', async () => {
        const oracle_list = [];
        for (let i = 0; i < 750; i++) {
            const pass = crypto.randomBytes(20).toString('hex');
            const account = await web3.eth.personal.newAccount(pass);
            await web3.eth.personal.unlockAccount(account, pass, 6000);
            const acc = accounts[2 * (i % 4)]; //  accounts with MOCs: [0, 2, 4, 6]
            const stake = 10000000000 - 1;
            const name = 'ORACLE-' + i;
            oracle_list.push({
                name,
                stake,
                owner_account: acc,
                account,
                pass,
            });
        }
        for (let i = 0; i < oracle_list.length; i++) {
            inserted.push(oracle_list[i]);
            const prevEntry = getPrevEntries(inserted);
            const o = oracle_list[i];
            await this.token.approve(this.oracleMgr.address, o.stake, {from: o.owner_account});
            await this.oracleMgr.registerOracleWithHint(o.account, o.name, o.stake, prevEntry[i], {
                from: o.owner_account,
            });
            await this.oracleMgr.subscribeToCoinPair(o.account, COINPAIR, {from: o.owner_account});
        }
    });

    it('Register 1 oracle in COINPAIR2', async () => {
        const pass = crypto.randomBytes(20).toString('hex');
        const account = await web3.eth.personal.newAccount(pass);
        await web3.eth.personal.unlockAccount(account, pass, 6000);
        const stake = 100000000;
        const name = 'ORACLE-COINPAIR2';
        const oracle = {
            name,
            stake,
            owner_account: accounts[0],
            account,
            pass,
        };
        inserted.push(oracle);
        const prevEntry = getPrevEntries(inserted);
        await this.token.approve(this.oracleMgr.address, oracle.stake, {
            from: oracle.owner_account,
        });
        await this.oracleMgr.registerOracleWithHint(
            oracle.account,
            oracle.name,
            oracle.stake,
            prevEntry[inserted.length - 1],
            {from: oracle.owner_account},
        );
        await this.oracleMgr.subscribeToCoinPair(oracle.account, COINPAIR2, {
            from: oracle.owner_account,
        });
    });

    it('Switch round', async () => {
        /*
        assert.equal((await this.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
        await this.coinPairPrice.switchRound();
        assert.equal((await this.coinPairPrice.getRoundInfo()).selectedOracles.length, maxOraclesPerRound);
        */
        // await helpers.printOracles(this.oracleMgr, COINPAIR2)
        assert.equal((await this.coinPairPrice2.getRoundInfo()).selectedOracles.length, 0);
        await this.coinPairPrice2.switchRound();
        assert.equal((await this.coinPairPrice2.getRoundInfo()).selectedOracles.length, 1);
    });
});
