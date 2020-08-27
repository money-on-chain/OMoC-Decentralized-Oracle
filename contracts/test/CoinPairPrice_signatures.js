const OracleManager = artifacts.require('OracleManager');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const helpers = require('./helpers');
const TestMOC = artifacts.require('TestMOC');
const SupportersWhitelisted = artifacts.require('SupportersWhitelisted');
const {expectRevert, BN} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

// Maybe this test suite is a little bit exaggerated, but it shows current behaviour so we can change it in the future
// The sender signature count as one signature and must be added to the message, to
// get the half + 1 valid signatures.
const TESTS_TO_RUN = [
    {
        oracles: 1,
        tests: [{signatures: 0, success: true}],
    },
    {
        oracles: 2,
        tests: [{signatures: 0}, {signatures: 1, success: true}],
    },
    {
        oracles: 3,
        tests: [{signatures: 0}, {signatures: 1, success: true}, {signatures: 2, success: true}],
    },
    {
        oracles: 4,
        tests: [
            {signatures: 0},
            {signatures: 1},
            {signatures: 2, success: true},
            {signatures: 3, success: true},
        ],
    },
    {
        oracles: 5,
        tests: [
            {signatures: 0},
            {signatures: 1},
            {signatures: 2, success: true},
            {signatures: 3, success: true},
            {signatures: 4, success: true},
        ],
    },
    {
        oracles: 6,
        tests: [
            {signatures: 0},
            {signatures: 1},
            {signatures: 2},
            {signatures: 3, success: true},
            {signatures: 4, success: true},
            {signatures: 5, success: true},
        ],
    },
    {
        oracles: 7,
        tests: [
            {signatures: 0},
            {signatures: 1},
            {signatures: 2},
            {signatures: 3, success: true},
            {signatures: 4, success: true},
            {signatures: 5, success: true},
            {signatures: 6, success: true},
        ],
    },

    {
        oracles: 8,
        tests: [
            {signatures: 0},
            {signatures: 1},
            {signatures: 2},
            {signatures: 3},
            {signatures: 4, success: true},
            {signatures: 5, success: true},
            {signatures: 6, success: true},
            {signatures: 7, success: true},
        ],
    },
];
contract('[ @skip-on-coverage ] CoinPairPrice Signature', async (accounts) => {
    const minOracleOwnerStake = (1 * 10 ** 18).toString();
    const minStayBlocks = 10;
    const feeSourceAccount = accounts[0];
    let ORACLE_DATA;
    before(() => {
        ORACLE_DATA = accounts
            .slice(1, 10)
            .map((a) => ({
                name: 'oracle-' + a + '.io',
                stake: (4 * 10 ** 18).toString(),
                account: a,
                owner: accounts[0],
            }))
            .sort((x, y) => web3.utils.toBN(x.account).cmp(web3.utils.toBN(y.account)));
    });

    async function register(oracleData, cant_oracles) {
        // [0] owner, [1] sender
        for (o of oracleData.slice(0, cant_oracles)) {
            await this.token.approve(this.staking.address, o.stake, {from: o.owner});
            await this.staking.registerOracle(o.account, o.name, {from: o.owner});
            await this.staking.deposit(o.stake, o.owner, {from: o.owner});
            const thisCoinPair = await this.coinPairPrice.coinPair();
            await this.staking.subscribeToCoinPair(o.account, thisCoinPair, {from: o.owner});
        }
        const FEES = new BN((0.33 * 10 ** 18).toString());
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });
        // switch round
        await this.coinPairPrice.switchRound();
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        expect(roundInfo['selectedOracles']).to.have.lengthOf(cant_oracles);
    }

    async function sign_with_owner(oracleData, cant_signatures) {
        // sender signature is assumed
        const sender = oracleData[0].account;
        const thisCoinPair = await this.coinPairPrice.coinPair();
        const lastPubBlock = (await this.coinPairPrice.lastPublicationBlock()).toString();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            helpers.coinPairStr(thisCoinPair),
            (10 ** 18).toString(),
            sender,
            lastPubBlock,
        );
        // Add my own signature.
        const own_signature = ethers.utils.splitSignature(await web3.eth.sign(encMsg, sender));
        const v = [own_signature.v];
        const r = [own_signature.r];
        const s = [own_signature.s];
        for (let i = 0; i < cant_signatures; i++) {
            const signature = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[i + 1].account),
            );
            v.push(signature.v);
            r.push(signature.r);
            s.push(signature.s);
        }
        await this.coinPairPrice.publishPrice(
            msg.version,
            thisCoinPair,
            msg.price,
            msg.votedOracle,
            lastPubBlock,
            v,
            r,
            s,
            {from: sender},
        );
    }

    // Dynamic tests.
    for (const t of TESTS_TO_RUN) {
        describe('Test for ' + t.oracles + ' oracles', async () => {
            before(async () => {
                const {
                    governor,
                    oracleMgr,
                    supporters,
                    staking,
                    token,
                } = await helpers.initContracts({
                    governorOwner: accounts[0],
                    minSubscriptionStake: minOracleOwnerStake,
                    period: new BN(10),
                });

                this.governor = governor;
                this.token = token;
                this.oracleMgr = oracleMgr;
                this.staking = staking;
                this.supporters = supporters;

                this.coinPairPrice = await CoinPairPrice.new();
                await this.coinPairPrice.initialize(
                    this.governor.address,
                    [accounts[0]], // whitelist
                    web3.utils.asciiToHex('BTCUSD'),
                    this.token.address,
                    10, // maxOraclesPerRound
                    30, // maxSubscribedOraclesPerRound
                    5, // roundLockPeriodInBlocks
                    3, // validPricePeriodInBlocks
                    2, // emergencyPublishingPeriodInBlocks
                    '100000000', // bootstrapPrice
                    this.oracleMgr.address,
                );

                // Create sample coin pairs
                await this.governor.registerCoinPair(
                    this.oracleMgr,
                    web3.utils.asciiToHex('BTCUSD'),
                    this.coinPairPrice.address,
                );
                await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');

                await register.call(this, ORACLE_DATA, t.oracles);
            });
            for (const test of t.tests) {
                if (test.success) {
                    it(
                        'Should success with ' +
                            t.oracles +
                            ' oracle, ' +
                            test.signatures +
                            ' signatures apart from owner',
                        async () => {
                            await sign_with_owner.call(this, ORACLE_DATA, test.signatures);
                        },
                    );
                } else {
                    it(
                        'Should fail with ' +
                            t.oracles +
                            ' oracles ' +
                            test.signatures +
                            ' signatures apart from owner',
                        async () => {
                            expectRevert(
                                sign_with_owner.call(this, ORACLE_DATA, test.signatures),
                                'Signature count must exceed 50% of active oracles',
                            );
                        },
                    );
                }
            }
        });
    }
});
