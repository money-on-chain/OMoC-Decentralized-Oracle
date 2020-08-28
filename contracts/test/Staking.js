const helpers = require('./helpers');
const TestMOC = artifacts.require('TestMOC');
const OracleManager = artifacts.require('OracleManager');
const Supporters = artifacts.require('Supporters');
const Staking = artifacts.require('Staking');
const CoinPairPrice = artifacts.require('CoinPairPrice');
const MockDelayMachine = artifacts.require('MockDelayMachine');
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers');

contract('OracleManager', async (accounts) => {
    const minCPSubscriptionStake = (1 * 10 ** 18).toString();
    const period = 20;
    // Values to initialize CoinPairPrice instances
    const maxOraclesPerRound = 10;
    const maxSubscribedOraclesPerRound = 30;
    const roundLockPeriodInBlocks = 5;
    const validPricePeriodInBlocks = 3;
    const emergencyPublishingPeriodInBlocks = 2;
    const bootstrapPrice = '100000000';

    before(async () => {
        this.governor = await helpers.createGovernor(accounts[8]);
        this.token = await TestMOC.new();
        await this.token.initialize(this.governor.address);
        this.oracleMgr = await OracleManager.new();
        this.supporters = await Supporters.new();
        this.mockDelayMachine = await MockDelayMachine.new();
        await this.mockDelayMachine.initialize(this.governor.address, this.token.address);
        this.staking = await Staking.new();

        this.coinPairPrice_BTCUSD = await CoinPairPrice.new();
        this.coinPairPrice_RIFBTC = await CoinPairPrice.new();
        await this.coinPairPrice_BTCUSD.initialize(
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
        await this.staking.initialize(
            this.governor.addr,
            this.supporters.address,
            this.oracleMgr.address,
            this.mockDelayMachine.address,
        );

        await this.governor.registerCoinPair(
            this.oracleMgr,
            web3.utils.asciiToHex('BTCUSD'),
            this.coinPairPrice_BTCUSD.address,
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

    it('Should register Oracles A, B, C', async () => {
        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
            from: oracleData[2].owner,
        });

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].account);
        assert.equal(info0.internetName, oracleData[0].name);
        assert.equal(info0.stake, 0);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].account);
        assert.equal(info1.internetName, oracleData[1].name);
        assert.equal(info1.stake, 0);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].account);
        assert.equal(info2.internetName, oracleData[2].name);
        assert.equal(info2.stake, 0);

        assert.isTrue(await this.staking.isOracleRegistered(oracleData[0].account));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[1].account));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[2].account));
    });

    it('Should deposit stake for Oracle A, B, C', async () => {
        const prevBalance0 = await this.token.balanceOf(oracleData[0].owner);
        const prevBalance1 = await this.token.balanceOf(oracleData[1].owner);
        const prevBalance2 = await this.token.balanceOf(oracleData[2].owner);

        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.token.approve(this.staking.address, oracleData[2].stake, {
            from: oracleData[2].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[2].stake, oracleData[2].owner, {
            from: oracleData[2].owner,
        });

        assert.isTrue(
            (await this.token.balanceOf(oracleData[0].owner)).eq(
                prevBalance0.sub(new BN(oracleData[0].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[1].owner)).eq(
                prevBalance1.sub(new BN(oracleData[1].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[2].owner)).eq(
                prevBalance2.sub(new BN(oracleData[2].stake)),
            ),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[0].owner)).eq(new BN(oracleData[0].stake)),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[1].owner)).eq(new BN(oracleData[1].stake)),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[2].owner)).eq(new BN(oracleData[2].stake)),
        );
    });

    it('Should subscribe Oracles A, B, C to coin pair BTCUSD', async () => {
        await this.staking.subscribeToCoinPair(
            oracleData[0].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[0].owner},
        );
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[0].account));

        await this.staking.subscribeToCoinPair(
            oracleData[1].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[1].owner},
        );
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[1].account));

        await this.staking.subscribeToCoinPair(
            oracleData[2].account,
            web3.utils.asciiToHex('BTCUSD'),
            {from: oracleData[2].owner},
        );
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[2].account));
    });

    it('Should lock stake of oracle B', async () => {
        const timestamp = Date.now() + 3600;
        await this.staking.lockMocs(oracleData[1].owner, timestamp, {from: oracleData[1].owner});
    });

    it('Should not be able to withdraw stake of oracle B', async () => {
        await expectRevert(
            this.staking.withdraw(oracleData[1].stake, {from: oracleData[1].owner}),
            'Stake not available for withdrawal.',
        );
    });

    it('Should not be able to withdraw stake of oracle D', async () => {
        await expectRevert(
            this.staking.withdraw(oracleData[3].stake, {from: oracleData[3].owner}),
            'Stake not available for withdrawal.',
        );
    });

    it('Should withdraw stake of oracle A', async () => {
        await this.staking.withdraw(oracleData[0].stake, {from: oracleData[0].owner});
    });
});
