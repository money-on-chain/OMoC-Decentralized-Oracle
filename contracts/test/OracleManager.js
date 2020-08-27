const OracleManager = artifacts.require('OracleManager');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const helpers = require('./helpers');
const TestMOC = artifacts.require('TestMOC');
const SupportersWhitelisted = artifacts.require('SupportersWhitelisted');
const Staking = artifacts.require('Staking');
const MockDelayMachine = artifacts.require('MockDelayMachine');
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract('OracleManager', async (accounts) => {
    const minCPSubscriptionStake = (1 * 10 ** 18).toString();
    const period = 20;
    const minStayBlocks = 10;
    const afterStopBlocks = 5;
    const feeSourceAccount = accounts[0];
    // Values to initialize CoinPairPrice instances
    const maxOraclesPerRound = 10;
    const maxSubscribedOraclesPerRound = 30;
    const roundLockPeriodInBlocks = 5;
    const validPricePeriodInBlocks = 3;
    const emergencyPublishingPeriodInBlocks = 2;
    const bootstrapPrice = '100000000';

    /* Account is the simulated oracle server address. The stake 
       will come from the owner's address. */

    before(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);

        this.token = await TestMOC.new();
        await this.token.initialize(this.governor.address);
        this.oracleMgr = await OracleManager.new();
        this.supporters = await SupportersWhitelisted.new();
        this.mockDelayMachine = await MockDelayMachine.new();
        await this.mockDelayMachine.initialize(this.governor.address, this.token.address);
        this.staking = await Staking.new();

        this.coinPairPrice_btcusd = await CoinPairPrice.new();
        this.coinPairPrice_RIFBTC = await CoinPairPrice.new();
        await this.coinPairPrice_btcusd.initialize(
            this.governor.addr,
            [accounts[0]],
            web3.utils.asciiToHex('BTCUSD'),
            this.token.address,
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            roundLockPeriodInBlocks,
            validPricePeriodInBlocks,
            emergencyPublishingPeriodInBlocks,
            bootstrapPrice,
            this.oracleMgr.address,
        );

        await this.coinPairPrice_RIFBTC.initialize(
            this.governor.addr,
            [accounts[0]],
            web3.utils.asciiToHex('RIFBTC'),
            this.token.address,
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            roundLockPeriodInBlocks,
            validPricePeriodInBlocks,
            emergencyPublishingPeriodInBlocks,
            bootstrapPrice,
            this.oracleMgr.address,
        );

        await this.staking.initialize(
            this.governor.addr,
            this.supporters.address,
            this.oracleMgr.address,
            this.mockDelayMachine.address,
        );
        await this.supporters.initialize(
            this.governor.addr,
            [this.oracleMgr.address, this.staking.address],
            this.token.address,
            period,
        );
        await this.oracleMgr.initialize(
            this.governor.addr,
            minCPSubscriptionStake,
            this.staking.address,
        );
        // Create sample coin pairs
        await this.governor.registerCoinPair(
            this.oracleMgr,
            web3.utils.asciiToHex('BTCUSD'),
            this.coinPairPrice_btcusd.address,
        );
        await this.governor.registerCoinPair(
            this.oracleMgr,
            web3.utils.asciiToHex('RIFBTC'),
            this.coinPairPrice_RIFBTC.address,
        );
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
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
            stake: (1 * 10 ** 18).toString(),
            account: accounts[5],
            owner: accounts[6],
        },
        {
            name: 'oracle-d.io',
            stake: (3 * 10 ** 18).toString(),
            account: accounts[7],
            owner: accounts[8],
        },
    ];

    oracleDataPair = oracleData
        .map((x, idx) => [idx, x])
        .sort((a, b) => new BN(a[1].account).cmp(new BN(b[1].account)));

    it('Should register Oracles A, B, C', async () => {
        await this.oracleMgr.registerOracle(
            oracleData[0].owner,
            oracleData[0].account,
            oracleData[0].name,
            {from: oracleData[0].owner},
        );
        await this.oracleMgr.registerOracle(
            oracleData[1].owner,
            oracleData[1].account,
            oracleData[1].name,
            {from: oracleData[1].owner},
        );
        await this.oracleMgr.registerOracle(
            oracleData[2].owner,
            oracleData[2].account,
            oracleData[2].name,
            {from: oracleData[2].owner},
        );

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner);
        assert.equal(info0.internetName, oracleData[0].name);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].owner);
        assert.equal(info1.internetName, oracleData[1].name);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].owner);
        assert.equal(info2.internetName, oracleData[2].name);

        assert.isTrue(
            await this.oracleMgr.isOracleRegistered(oracleData[0].owner, {
                from: oracleData[0].owner,
            }),
        );
        assert.isTrue(
            await this.oracleMgr.isOracleRegistered(oracleData[0].owner, {
                from: oracleData[0].owner,
            }),
        );
        assert.isTrue(
            await this.oracleMgr.isOracleRegistered(oracleData[0].owner, {
                from: oracleData[0].owner,
            }),
        );
    });

    it('Should fail to register Oracle with null address as owner address', async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(constants.ZERO_ADDRESS, accounts[7], 'mock.io', {
                from: accounts[7],
            }),
            'Owner address cannot be 0x0',
        );
    });

    it('Should fail to register Oracle with null address as oracle address', async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(accounts[7], constants.ZERO_ADDRESS, 'mock.io', {
                from: accounts[7],
            }),
            'Oracle address cannot be 0x0',
        );
    });

    it('Should fail to register an Oracle twice', async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(
                oracleData[0].owner,
                oracleData[0].account,
                oracleData[0].name,
                {
                    from: oracleData[0].owner,
                },
            ),
            'Oracle already registered',
        );
    });

    /*
    it('Should reject to change name of unregistered oracle', async () => {
        const randomAddr = ethers.utils.hexlify(ethers.utils.randomBytes(20));
        await expectRevert(this.oracleMgr.setOracleName(randomAddr, 'X'), 'Oracle not registered');
    });

    it('Should reject to change name of oracle if called by non-owner', async () => {
        await expectRevert(
            this.oracleMgr.setOracleName(oracleData[0].account, 'XYZ', {from: oracleData[3].owner}),
            'This can be called by oracle owner only',
        );
    });

    it('Should change name of oracle A if requested by owner', async () => {
        const newName = 'oracle-coinfabrik.ar';

        await this.oracleMgr.setOracleName(oracleData[0].account, newName, {
            from: oracleData[0].owner,
        });
        assert.equal(
            (await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account)).internetName,
            newName,
        );
    });

    it('Should subscribe oracle A to coin-pair USDBTC', async () => {
        await this.oracleMgr.subscribeToCoinPair(
            oracleData[0].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[0].owner},
        );
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].account));
    });

    it('Should fail to subscribe oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.subscribeToCoinPair(
                oracleData[0].account,
                web3.utils.asciiToHex('BTCUSD'),
            ),
            'Must be called by oracle owner',
        );
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

    it('Should fail to subscribe oracle if already subscribed', async () => {
        await expectRevert(
            this.oracleMgr.subscribeToCoinPair(
                oracleData[0].account,
                web3.utils.asciiToHex('BTCUSD'),
                {from: oracleData[0].owner},
            ),
            'Oracle is already subscribed to this coin pair',
        );
    });

    it('Should subscribe oracle B to both coin-pairs', async () => {
        await this.oracleMgr.subscribeToCoinPair(
            oracleData[1].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[1].owner},
        );
        await this.oracleMgr.subscribeToCoinPair(
            oracleData[1].account,
            web3.utils.asciiToHex('RIFBTC'),
            {from: oracleData[1].owner},
        );
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].account));
        assert.isTrue(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[1].account));
        assert.isFalse(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[2].account));
        assert.isFalse(await this.coinPairPrice_btcusd.isSubscribed(oracleData[2].account));
    });

    it('Should retrieve subscribed coinpair addresses for each oracle', async () => {
        let v0 = await this.oracleMgr.getSubscribedCoinPairAddresses(oracleData[0].account);
        let v1 = await this.oracleMgr.getSubscribedCoinPairAddresses(oracleData[1].account);
        let v2 = await this.oracleMgr.getSubscribedCoinPairAddresses(oracleData[2].account);
        assert.equal(v0.count, 1);
        assert.equal(v1.count, 2);
        assert.equal(v2.count, 0);

        assert.equal(v0.addresses[0], this.coinPairPrice_btcusd.address);
        assert.equal(v0.addresses[1], constants.ZERO_ADDRESS);

        assert.equal(v1.addresses[0], this.coinPairPrice_btcusd.address);
        assert.equal(v1.addresses[1], this.coinPairPrice_RIFBTC.address);

        assert.equal(v2.addresses[0], constants.ZERO_ADDRESS);
        assert.equal(v2.addresses[1], constants.ZERO_ADDRESS);
    });

    it('Should unsubscribe oracle A from coin-pair USDBTC', async () => {
        await this.oracleMgr.unsubscribeFromCoinPair(
            oracleData[0].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[0].owner},
        );
        assert.isFalse(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].account));
    });

    it('Should fail to unsubscribe oracle if not subscribed', async () => {
        await expectRevert(
            this.oracleMgr.unsubscribeFromCoinPair(
                oracleData[0].account,
                web3.utils.asciiToHex('BTCUSD'),
                {from: oracleData[0].owner},
            ),
            'Oracle is not subscribed to this coin pair',
        );
    });

    it('Should fail to remove an oracle if is not registered', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[3].account, {from: oracleData[3].owner}),
            'Oracle not registered',
        );
    });

    it('Should fail to remove an oracle if called from non-owner', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[0].account),
            'This can be called by oracle owner only',
        );
    });

    it('Should remove an oracle  A if it did not participate yet ', async () => {
        const ownerBalance = await this.token.balanceOf(oracleData[0].owner);
        const originalStake = (
            await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account)
        ).stake;

        assert.isTrue(await this.coinPairPrice_btcusd.canRemoveOracle(oracleData[0].account));
        assert.isTrue(await this.coinPairPrice_RIFBTC.canRemoveOracle(oracleData[0].account));

        await this.oracleMgr.removeOracle(oracleData[0].account, {from: oracleData[0].owner});
        assert.isTrue(
            (await this.token.balanceOf(oracleData[0].owner)).eq(
                ownerBalance.add(new BN(originalStake)),
            ),
        );
    });

    it('Should fail to remove an oracle with all coinpairs with # minimum idle rounds not passed', async () => {
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[1].account));
        await this.coinPairPrice_btcusd.switchRound(); // One round
        await helpers.mineUntilNextRound(this.coinPairPrice_btcusd);

        await this.coinPairPrice_RIFBTC.switchRound(); // One round
        await helpers.mineUntilNextRound(this.coinPairPrice_btcusd);

        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[1].account, {from: oracleData[1].owner}),
            'Oracle cannot be removed at this time',
        );
    });

    it('Should fail to remove an oracle with one coinpair passing # of idle rounds and the other not ', async () => {
        // subscribe another oracle to keep rounds running first

        await this.oracleMgr.subscribeToCoinPair(
            oracleData[2].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[2].owner},
        );
        await this.oracleMgr.subscribeToCoinPair(
            oracleData[2].account,
            web3.utils.asciiToHex('RIFBTC'),
            {from: oracleData[2].owner},
        );
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[2].account));
        assert.isTrue(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[2].account));

        // ---

        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[1].account));
        assert.isTrue(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[1].account));

        await helpers.mineUntilNextRound(this.coinPairPrice_btcusd);
        await this.coinPairPrice_btcusd.switchRound(); // One round selected

        // Set to Idle and pass minimum required rounds ...

        await this.oracleMgr.unsubscribeFromCoinPair(
            oracleData[1].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[1].owner},
        );

        await helpers.mineUntilNextRound(this.coinPairPrice_btcusd);
        await this.coinPairPrice_btcusd.switchRound(); // One round
        await helpers.mineUntilNextRound(this.coinPairPrice_btcusd);
        await this.coinPairPrice_btcusd.switchRound(); // One round

        assert.isTrue(await this.coinPairPrice_btcusd.canRemoveOracle(oracleData[1].account));
        assert.isFalse(await this.coinPairPrice_RIFBTC.canRemoveOracle(oracleData[1].account));

        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[1].account, {from: oracleData[1].owner}),
            'Oracle cannot be removed at this time',
        );
    });

    it('Should remove an oracle when ALL coinpairs passed # of idle rounds', async () => {
        // Unsubscribe from the other pair  and pass minimum required rounds ...

        await this.oracleMgr.unsubscribeFromCoinPair(
            oracleData[1].account,
            web3.utils.asciiToHex('RIFBTC'),
            {from: oracleData[1].owner},
        );

        await helpers.mineUntilNextRound(this.coinPairPrice_RIFBTC);
        await this.coinPairPrice_RIFBTC.switchRound(); // One round
        await helpers.mineUntilNextRound(this.coinPairPrice_RIFBTC);
        await this.coinPairPrice_RIFBTC.switchRound(); // One round
        await helpers.mineUntilNextRound(this.coinPairPrice_RIFBTC);
        await this.coinPairPrice_RIFBTC.switchRound(); // One round

        assert.isTrue(await this.coinPairPrice_btcusd.canRemoveOracle(oracleData[1].account));
        assert.isTrue(await this.coinPairPrice_RIFBTC.canRemoveOracle(oracleData[1].account));

        const ownerBalance = await this.token.balanceOf(oracleData[1].owner);
        const originalStake = (
            await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].account)
        ).stake;

        await this.oracleMgr.removeOracle(oracleData[1].account, {from: oracleData[1].owner});

        assert.isTrue(
            (await this.token.balanceOf(oracleData[1].owner)).eq(
                ownerBalance.add(new BN(originalStake)),
            ),
        );
    });*/
});
