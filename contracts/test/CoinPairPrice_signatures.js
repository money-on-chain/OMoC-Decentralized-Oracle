const CoinPairPrice = artifacts.require('CoinPairPrice');
const helpers = require('./helpers');
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
    const feeSourceAccount = accounts[0];
    let ORACLE_DATA;
    before(() => {
        ORACLE_DATA = accounts
            .slice(1, 10)
            .map((a, idx) => ({
                name: 'oracle-' + a + '.io',
                stake: (4 * 10 ** 18).toString(),
                account: a,
                owner: accounts[idx],
            }))
            .sort((x, y) => web3.utils.toBN(x.account).cmp(web3.utils.toBN(y.account)));
    });

    async function register(oracleData, cantOracles) {
        // [0] owner, [1] sender
        for (const o of oracleData.slice(0, cantOracles)) {
            await this.governor.mint(this.token.address, o.owner, '800000000000000000000');
            await this.token.approve(this.staking.address, o.stake, {from: o.owner});
            await this.staking.registerOracle(o.account, o.name, {from: o.owner});
            await this.staking.deposit(o.stake, o.owner, {from: o.owner});
            const thisCoinPair = await this.coinPairPrice.coinPair();
            await this.staking.subscribeToCoinPair(thisCoinPair, {from: o.owner});
        }
        const FEES = new BN((0.33 * 10 ** 18).toString());
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });
        // switch round
        await this.coinPairPrice.switchRound();
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        expect(roundInfo['selectedOracles']).to.have.lengthOf(cantOracles);
    }

    async function signWithOwner(oracleData, cantSignatures) {
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
        const ownSignature = ethers.utils.splitSignature(await web3.eth.sign(encMsg, sender));
        const v = [ownSignature.v];
        const r = [ownSignature.r];
        const s = [ownSignature.s];
        for (let i = 0; i < cantSignatures; i++) {
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
                const contracts = await helpers.initContracts({
                    governorOwner: accounts[0],
                    period: new BN(10),
                });
                Object.assign(this, contracts);

                this.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
                    ...contracts,
                    whitelist: [accounts[0]],
                });
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
                            await signWithOwner.call(this, ORACLE_DATA, test.signatures);
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
                                signWithOwner.call(this, ORACLE_DATA, test.signatures),
                                'Signature count must exceed 50% of active oracles',
                            );
                        },
                    );
                }
            }
        });
    }
});
