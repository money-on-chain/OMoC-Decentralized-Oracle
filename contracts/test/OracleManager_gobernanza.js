const OracleManager = artifacts.require('OracleManager');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const helpers = require('./helpers');
const TestMOC = artifacts.require('TestMOC');
const Supporters = artifacts.require('Supporters');
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers');

contract('OracleManager by gobernanza', async (accounts) => {
    const minOracleOwnerStake = (1 * 10 ** 18).toString();
    const period = 20;
    const GOBERNOR = accounts[8];
    const oracleData = [
        {
            name: 'oracle-a.io',
            stake: (4 * 10 ** 18).toString(),
            account: accounts[1],
            owner: accounts[2],
        },
    ];

    it('Creation', async () => {
        this.governor_data = await helpers.createGovernor(GOBERNOR);
        this.token = await TestMOC.new();
        await this.token.initialize(this.governor_data.address);
        this.oracleMgr = await OracleManager.new();
        this.supporters = await Supporters.new();
        this.coinPairPrice = await CoinPairPrice.new();
        this.coinPair = web3.utils.asciiToHex('BTCUSD');
        await this.coinPairPrice.initialize(
            this.governor_data.addr,
            [accounts[0]],
            this.coinPair,
            this.token.address,
            10, // maxOraclesPerRound
            30, // maxSubscribedOraclesPerRound
            5, // roundLockPeriodInBlocks
            3, // validPricePeriodInBlocks
            2, // emergencyPublishingPeriodInBlocks
            '100000000', // bootstrapPrice
            this.oracleMgr.address,
        );

        await this.supporters.initialize(
            this.governor_data.addr,
            [this.oracleMgr.address],
            this.token.address,
            period,
        );
        await this.oracleMgr.initialize(
            this.governor_data.addr,
            minOracleOwnerStake,
            this.supporters.address,
        );
        // Create sample coin pairs
        await this.governor_data.registerCoinPair(
            this.oracleMgr,
            this.coinPair,
            this.coinPairPrice.address,
        );
        await this.governor_data.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor_data.mint(this.token.address, accounts[2], '800000000000000000000');
    });

    it('Registration and subscription', async () => {
        await this.token.approve(this.oracleMgr.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.oracleMgr.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account);
        assert.equal(info0.internetName, oracleData[0].name);

        await this.oracleMgr.subscribeToCoinPair(
            oracleData[0].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[0].owner},
        );
        assert.isTrue(await this.coinPairPrice.isSubscribed(oracleData[0].account));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].account));
    });

    it('Should fail to unsubscribe oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.unsubscribeFromCoinPair(
                oracleData[0].account,
                web3.utils.asciiToHex('BTCUSD'),
            ),
            'Must be called by oracle owner',
        );
    });

    it('Unsubscribe by gobernanza', async () => {
        const OracleManagerUnsubscribeChange = artifacts.require('OracleManagerUnsubscribeChange');
        const change = await OracleManagerUnsubscribeChange.new(
            this.oracleMgr.address,
            oracleData[0].account,
            this.coinPair,
        );
        await this.governor_data.governor.executeChange(change.address, {from: GOBERNOR});
        assert.isFalse(await this.coinPairPrice.isSubscribed(oracleData[0].account));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].account));
    });

    it('Should fail to remove oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[0].account),
            'This can be called by oracle owner only',
        );
    });

    it('Remove by gobernanza', async () => {
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].account));
        const OracleManagerRemoveChange = artifacts.require('OracleManagerRemoveChange');
        const change = await OracleManagerRemoveChange.new(
            this.oracleMgr.address,
            oracleData[0].account,
        );
        await this.governor_data.governor.executeChange(change.address, {from: GOBERNOR});
        assert.isFalse(await this.oracleMgr.isOracleRegistered(oracleData[0].account));
    });
});
