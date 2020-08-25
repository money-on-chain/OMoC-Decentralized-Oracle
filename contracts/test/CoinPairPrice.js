const OracleManager = artifacts.require('OracleManager');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const helpers = require('./helpers');
const TestMOC = artifacts.require('TestMOC');
const SupportersWhitelisted = artifacts.require('SupportersWhitelisted');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract('CoinPairPrice', async (accounts) => {
    const minOracleOwnerStake = (1 * 10 ** 18).toString();
    const period = 20;
    const minStayBlocks = 10;
    const afterStopBlocks = 5;
    const feeSourceAccount = accounts[0];

    /* Account is the simulated oracle server address. The stake 
       will come from the owner's address. */

    before(async () => {
        this.bootstrapPrice = new BN('100000000');
        this.validPricePeriodInBlocks = 3;
        this.emergencyPublishingPeriodInBlocks = 2;
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        await this.token.initialize(this.governor.address);

        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();

        this.coinPairPrice = await CoinPairPrice.new();

        await this.coinPairPrice.initialize(
            this.governor.addr,
            [accounts[0]], // whitlist
            web3.utils.asciiToHex('BTCUSD'),
            this.token.address,
            3, // maxOraclesPerRound
            5, // roundLockPeriodInBlocks
            this.validPricePeriodInBlocks,
            this.emergencyPublishingPeriodInBlocks,
            this.bootstrapPrice,
            2, // numIdleRounds
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
        await this.governor.registerCoinPair(
            this.oracleMgr,
            web3.utils.asciiToHex('BTCUSD'),
            this.coinPairPrice.address,
        );
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[8], '800000000000000000000');
    });

    const oracleData = [
        {
            name: 'oracle-a.io',
            stake: (4 * 10 ** 18).toString(),
            account: accounts[1],
            owner: accounts[2],
        },
        {
            name: 'oracle-b.io',
            stake: (8 * 10 ** 18).toString(),
            account: accounts[3],
            owner: accounts[4],
        },
        {
            name: 'oracle-c.io',
            stake: (3 * 10 ** 18).toString(),
            account: accounts[5],
            owner: accounts[6],
        },
        {
            name: 'oracle-d.io',
            stake: (1 * 10 ** 18).toString(),
            account: accounts[7],
            owner: accounts[8],
        },
    ];

    oracleDataPair = oracleData
        .map((x, idx) => [idx, x])
        .sort((a, b) => new BN(a[1].account).cmp(new BN(b[1].account)));

    it('Should register Oracles A, B, C', async () => {
        const initialBalance1 = await this.token.balanceOf(oracleData[0].owner);
        const initialBalance2 = await this.token.balanceOf(oracleData[1].owner);
        const initialBalance3 = await this.token.balanceOf(oracleData[2].owner);

        // console.log(initialBalance1.toString(), oracleData[0].stake.toString());
        // console.log(initialBalance2.toString(), oracleData[1].stake.toString());
        // console.log(initialBalance3.toString(), oracleData[2].stake.toString());

        await this.token.approve(this.oracleMgr.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.oracleMgr.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.token.approve(this.oracleMgr.address, oracleData[2].stake, {
            from: oracleData[2].owner,
        });

        await this.oracleMgr.registerOracle(
            oracleData[0].account,
            oracleData[0].name,
            oracleData[0].stake,
            {from: oracleData[0].owner},
        );
        await this.oracleMgr.registerOracle(
            oracleData[1].account,
            oracleData[1].name,
            oracleData[1].stake,
            {from: oracleData[1].owner},
        );
        await this.oracleMgr.registerOracle(
            oracleData[2].account,
            oracleData[2].name,
            oracleData[2].stake,
            {from: oracleData[2].owner},
        );

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account);
        assert.equal(info0.internetName, oracleData[0].name);
        assert.equal(info0.stake, oracleData[0].stake);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].account);
        assert.equal(info1.internetName, oracleData[1].name);
        assert.equal(info1.stake, oracleData[1].stake);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].account);
        assert.equal(info2.internetName, oracleData[2].name);
        assert.equal(info2.stake, oracleData[2].stake);

        assert.isTrue(
            (await this.token.balanceOf(oracleData[0].owner)).eq(
                initialBalance1.sub(new BN(oracleData[0].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[1].owner)).eq(
                initialBalance2.sub(new BN(oracleData[1].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[2].owner)).eq(
                initialBalance3.sub(new BN(oracleData[2].stake)),
            ),
        );
    });

    it('Should subscribe oracles A,B,C to this coin pair', async () => {
        const thisCoinPair = await this.coinPairPrice.coinPair();
        await this.oracleMgr.subscribeToCoinPair(oracleData[0].account, thisCoinPair, {
            from: oracleData[0].owner,
        });
        await this.oracleMgr.subscribeToCoinPair(oracleData[1].account, thisCoinPair, {
            from: oracleData[1].owner,
        });
        await this.oracleMgr.subscribeToCoinPair(oracleData[2].account, thisCoinPair, {
            from: oracleData[2].owner,
        });
    });

    it('Should deposit fees from approved account', async () => {
        const FEES = new BN((0.33 * 10 ** 18).toString());

        const oldFees = await this.coinPairPrice.getAvailableRewardFees();
        const sourceBalance = await this.token.balanceOf(feeSourceAccount);
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });

        const newBalance = await this.token.balanceOf(feeSourceAccount);
        assert.equal(newBalance.toString(), sourceBalance.sub(FEES).toString());
        assert.equal(
            await this.coinPairPrice.getAvailableRewardFees(),
            oldFees.add(FEES).toString(),
        );
    });

    it('Should fail to publish price before the first switch-round call', async () => {
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Round not open',
        );
    });

    it('Should start the first round with ordered oracles by stake', async () => {
        let roundInfo = await this.coinPairPrice.getRoundInfo();
        assert.equal(roundInfo.round, 0);
        await this.coinPairPrice.switchRound();
        roundInfo = await this.coinPairPrice.getRoundInfo();
        let info0 = await this.coinPairPrice.getOracleRoundInfo(oracleData[0].account);
        let info1 = await this.coinPairPrice.getOracleRoundInfo(oracleData[1].account);
        let info2 = await this.coinPairPrice.getOracleRoundInfo(oracleData[2].account);
        assert.equal(info0.points, 0);
        assert.equal(info1.points, 0);
        assert.equal(info2.points, 0);
        roundInfo = await this.coinPairPrice.getRoundInfo();
        assert.equal(roundInfo.round, '1');
        info0 = await this.oracleMgr.getOracleRegistrationInfo(roundInfo.selectedOracles[0]);
        info1 = await this.oracleMgr.getOracleRegistrationInfo(roundInfo.selectedOracles[1]);
        info2 = await this.oracleMgr.getOracleRegistrationInfo(roundInfo.selectedOracles[2]);
        assert.isTrue(info0.stake > info1.stake);
        assert.isTrue(info1.stake > info2.stake);
    });

    it('Should fail to publish with mismatching coinpair', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'ARSBTC',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex(msg.coinpair),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Coin pair - contract mismatch',
        );
    });

    it('Should fail to publish with zero price', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            0 * (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Price must be positive and non-zero',
        );
    });

    it('Should fail to publish with non-V3 format', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            1,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'This contract accepts only V3 format',
        );
    });

    it('Should fail to publish with inconsistent signature count', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Inconsistent signature count',
        );
    });

    it('Should fail to switch to new round before lock period expiration', async () => {
        await time.advanceBlock(); // Just advance ONE block

        await expectRevert(
            this.coinPairPrice.switchRound(),
            ' The current round lock period is active',
        );
    });

    it('Should fail to publish price if some signer is not subscribed', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();

        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[3].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Signing oracle not subscribed',
        );
    });

    it('Should fail to publish price if signature v-component is invalid', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        s1.v = 100;

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Cannot recover signature',
        );
    });

    it('Oracle A should publish a valid price message signed by A,B and C', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await this.coinPairPrice.publishPrice(
            msg.version,
            web3.utils.asciiToHex('BTCUSD'),
            msg.price,
            msg.votedOracle,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
            [s3.v, s2.v, s1.v],
            [s3.r, s2.r, s1.r],
            [s3.s, s2.s, s1.s],
            {from: oracleData[0].account},
        );
    });

    it('Should retrieve the last price published from address 1', async () => {
        const p = await this.coinPairPrice.getPrice({from: helpers.ADDRESS_ONE});
        assert.equal(p.toString(), (10 ** 18).toString());
    });

    it('Should retrieve the last price published from whitelisted address', async () => {
        const p = await this.coinPairPrice.getPrice({from: helpers.ADDRESS_ONE});
        assert.equal(p.toString(), (10 ** 18).toString());
    });

    it('Should fail to retrieve the last price from any non-WL address', async () => {
        await expectRevert(
            this.coinPairPrice.getPrice({from: web3.utils.randomHex(20)}),
            'Address is not whitelisted',
        );
    });

    it('Price should be valid for validPricePeriodInBlocks blocks', async () => {
        const {0: price, 1: valid} = await this.coinPairPrice.peek({from: helpers.ADDRESS_ONE});
        assert.equal(helpers.bytes32toBN(price).toString(), (10 ** 18).toString());
        assert.isTrue(valid);
        await helpers.mineBlocks(this.validPricePeriodInBlocks);
        const {0: price_after, 1: not_valid} = await this.coinPairPrice.peek({
            from: helpers.ADDRESS_ONE,
        });
        assert.equal(helpers.bytes32toBN(price_after).toString(), (10 ** 18).toString());
        assert.isFalse(not_valid);
    });

    it('Should fail to publish price from  unsubscribed address', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );

        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s3.r],
                [s1.s, s2.s, s3.s],
                {from: accounts[7]},
            ),
            'Sender oracle not subscribed',
        );
    });

    it('Should fail to publish price if sender is not a voted oracle', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );

        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s3.r],
                [s1.s, s2.s, s3.s],
                {from: oracleData[2].account},
            ),
            'Your address does not match the voted oracle',
        );
    });

    it('Should fail to publish price if block does not match where the last publication occurred', async () => {
        const thisBlock = 0;

        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            0,
        );

        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                0,
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s3.r],
                [s1.s, s2.s, s3.s],
                {from: oracleData[0].account},
            ),
            'Blocknumber does not match the last publication block',
        );
    });

    it('Should fail to publish price if signature count is  less than 50% of participating oracles', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );

        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v],
                [s1.r],
                [s1.s],
                {from: oracleData[0].account},
            ),
            'Signature count must exceed 50% of active oracles',
        );
    });

    it('Should fail to publish if signatures are not unique', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s1.v, s1.v],
                [s1.r, s1.r, s1.r],
                [s1.s, s1.s, s1.s],
                {from: oracleData[0].account},
            ),
            'Signatures are not unique or not ordered by address',
        );
    });

    it('Should fail to publish if signatures are in the wrong order', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));
        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s3.r],
                [s1.s, s2.s, s3.s],
                {from: oracleData[0].account},
            ),
            'Signatures are not unique or not ordered by address',
        );
    });

    it('Should register and subscribe oracle D while round is running', async () => {
        const thisCoinPair = await this.coinPairPrice.coinPair();
        const initialBalance1 = await this.token.balanceOf(oracleData[3].owner);
        await this.token.approve(this.oracleMgr.address, oracleData[3].stake, {
            from: oracleData[3].owner,
        });
        await this.oracleMgr.registerOracle(
            oracleData[3].account,
            oracleData[3].name,
            oracleData[3].stake,
            {from: oracleData[3].owner},
        );
        await this.oracleMgr.subscribeToCoinPair(oracleData[3].account, thisCoinPair, {
            from: oracleData[3].owner,
        });
        assert.isTrue(
            (await this.token.balanceOf(oracleData[3].owner)).eq(
                initialBalance1.sub(new BN(oracleData[3].stake)),
            ),
        );
    });

    it('Should fail to publish if voter/sender is D (not a selected-in-round oracle)', async () => {
        // console.log(await this.coinPairPrice.getRoundInfo());
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[3].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s2.r],
                [s1.s, s2.s, s3.s],
                {from: oracleData[3].account},
            ),
            'Voter oracle is not part of this round',
        );
    });

    it('Should fail to publish if any signer is not part of round', async () => {
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[3].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await expectRevert(
            this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s1.v, s2.v, s3.v],
                [s1.r, s2.r, s2.r],
                [s1.s, s2.s, s3.s],
                {from: oracleData[0].account},
            ),
            'Address of signer not part of this round',
        );
    });

    it('Should add-up points submitting several prices from Oracles A,B and C', async () => {
        let roundInfo = await this.coinPairPrice.getRoundInfo();

        // Addup points submitting several prices from Oracles A,B and C

        // Oracle A    publications.

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        // Oracle B  publications.

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        // Oracle C  publications.
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[2].account,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.lastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[2].account},
            );
        }
    });

    it('Should wait for  blocks to finish round (please wait) ', async () => {
        await helpers.mineUntilNextRound(this.coinPairPrice);
    });

    it('Should be possible for Oracle A to publish a valid price message after the lock period ', async () => {
        const roundInfo = await this.coinPairPrice.getRoundInfo();
        const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
            3,
            'BTCUSD',
            (10 ** 18).toString(),
            oracleData[0].account,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[0].account));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[1].account));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracleData[2].account));

        await this.coinPairPrice.publishPrice(
            msg.version,
            web3.utils.asciiToHex('BTCUSD'),
            msg.price,
            msg.votedOracle,
            (await this.coinPairPrice.lastPublicationBlock()).toString(),
            [s3.v, s2.v, s1.v],
            [s3.r, s2.r, s1.r],
            [s3.s, s2.s, s1.s],
            {from: oracleData[0].account},
        );
    });

    it('Should switch to new round, distributing rewards and resetting points/flags to zero', async () => {
        // Verify proper distribution according to total fee balance and
        // points of oracles.

        const sourceBalance = await this.coinPairPrice.getAvailableRewardFees();

        const balance1 = await this.token.balanceOf(oracleData[0].owner);
        const balance2 = await this.token.balanceOf(oracleData[1].owner);
        const balance3 = await this.token.balanceOf(oracleData[2].owner);
        const points1 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[0].account)).points;
        const points2 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[1].account)).points;
        const points3 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[2].account)).points;
        const totalPoints = points1.add(points2).add(points3);

        const expectReward1 = points1.mul(sourceBalance).div(totalPoints);
        const expectReward2 = points2.mul(sourceBalance).div(totalPoints);
        const expectReward3 = points3.mul(sourceBalance).div(totalPoints);
        const expectTotalReward = expectReward1.add(expectReward2).add(expectReward3);
        // console.log(sourceBalance.toString(), totalPoints.toString(),
        //     balance1.toString(), balance2.toString(), balance3.toString(),
        //     points1.toString(), points2.toString(), points3.toString(),
        //     expectReward1.toString(), expectReward2.toString(), expectReward3.toString());

        const selOracles = (await this.coinPairPrice.getRoundInfo()).selectedOracles;
        await this.coinPairPrice.switchRound();

        // Check if participating oracles in prev round are cleared properly.

        for (i = 0; i < selOracles.length; i++) {
            info = await this.coinPairPrice.getOracleRoundInfo(selOracles[i]);
            assert.equal(info.points, 0);
        }

        const expectBalance1 = balance1.add(expectReward1);
        const expectBalance2 = balance2.add(expectReward2);
        const expectBalance3 = balance3.add(expectReward3);

        assert.equal(
            expectBalance1.toString(),
            (await this.token.balanceOf(oracleData[0].owner)).toString(),
        );
        assert.equal(
            expectBalance2.toString(),
            (await this.token.balanceOf(oracleData[1].owner)).toString(),
        );
        assert.equal(
            expectBalance3.toString(),
            (await this.token.balanceOf(oracleData[2].owner)).toString(),
        );

        const postFeeBalance = await this.coinPairPrice.getAvailableRewardFees();
        assert.equal(
            postFeeBalance.toString(),
            BN(sourceBalance).sub(expectTotalReward).toString(),
        );
    });

    it('Should exclude from round unsubscribed oracles and let remove after that', async () => {
        const thisCoinPair = await this.coinPairPrice.coinPair();

        const roundInfo1 = await this.coinPairPrice.getRoundInfo();
        assert.isTrue(roundInfo1.selectedOracles.includes(oracleData[0].account));

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        // still selected
        const roundInfo2 = await this.coinPairPrice.getRoundInfo();
        assert.isTrue(roundInfo2.selectedOracles.includes(oracleData[0].account));

        await this.oracleMgr.unsubscribeFromCoinPair(oracleData[0].account, thisCoinPair, {
            from: oracleData[0].owner,
        });

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        const roundInfo3 = await this.coinPairPrice.getRoundInfo();
        assert.isFalse(roundInfo3.selectedOracles.includes(oracleData[0].account));

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();
        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        const info = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account);
        assert.equal(info.internetName, 'oracle-a.io');
        const initialBalance = await this.token.balanceOf(oracleData[0].owner);

        await this.oracleMgr.removeOracle(oracleData[0].account, {from: oracleData[0].owner});

        await expectRevert(
            this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account),
            'Oracle not registered',
        );
        assert.equal(
            (await this.token.balanceOf(oracleData[0].owner)).toString(),
            initialBalance.add(info.stake).toString(),
        );
    });
});
