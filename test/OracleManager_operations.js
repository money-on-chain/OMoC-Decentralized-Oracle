const helpers = require('./helpers');
const { ADDRESS_ONE, ADDRESS_ZERO } = require('./helpers');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { toHex, padLeft, toChecksumAddress, toBN } = require('web3-utils');
const { expect } = require('chai');
const MockGovernor = artifacts.require('@moc/shared/MockGovernor');
const OracleManager = artifacts.require('OracleManager');
const Staking = artifacts.require('Staking');
const CoinPairPrice = artifacts.require('CoinPairPrice');

contract('OracleManager operations', async (accounts) => {
    const ORACLE_OWNER = accounts[1];
    const GOVERNOR_OWNER = accounts[8];
    const COINPAIR_NAME = 'BTCUSD';
    const COINPAIR_ID = padLeft(toHex(COINPAIR_NAME), 64);
    const MIN_ORACLE_STAKE = (10 ** 18).toString();

    before(async () => {
        const wList = [GOVERNOR_OWNER];
        this.governor = await MockGovernor.new(GOVERNOR_OWNER);
        const contracts = await helpers.initContracts({
            governor: this.governor,
            minSubscriptionStake: MIN_ORACLE_STAKE,
            wList,
        });
        Object.assign(this, contracts);
        await this.token.mint(ORACLE_OWNER, MIN_ORACLE_STAKE, { from: GOVERNOR_OWNER });
        await this.token.approve(this.staking.address, MIN_ORACLE_STAKE, { from: ORACLE_OWNER });
        await this.staking.deposit(MIN_ORACLE_STAKE, ORACLE_OWNER, { from: ORACLE_OWNER });

        this.coinPairPrice = await CoinPairPrice.new(GOVERNOR_OWNER);
        await this.coinPairPrice.initialize(
            this.governor.address,
            [GOVERNOR_OWNER],
            COINPAIR_ID,
            ADDRESS_ONE, // token_address
            10, // maxOraclesPerRound
            30, // maxSubscribedOraclesPerRound
            60, // roundLockPeriodInSecs,
            3, // validPricePeriodInBlocks,
            2, // emergencyPublishingPeriodInBlocks,
            '100000000', // bootstrapPrice,
            this.oracleMgr.address,
            "0x0000000000000000000000000000000000000000"
        ); // ^ can be replaced with contracts.registry but it's not required for this tests

        await this.oracleMgr.registerCoinPair(COINPAIR_ID, this.coinPairPrice.address, {
            from: GOVERNOR_OWNER,
        });
    });

    it('Whitelist manipulation', async () => {
        await expectRevert(this.oracleMgr.addToWhitelist(accounts[2]), 'Invalid changer');

        await this.oracleMgr.addToWhitelist(accounts[2], { from: GOVERNOR_OWNER });

        await expectRevert(this.oracleMgr.removeFromWhitelist(accounts[2]), 'Invalid changer');

        await this.oracleMgr.removeFromWhitelist(accounts[2], { from: GOVERNOR_OWNER });
    });

    it('Change oracle address', async () => {
        await this.oracleMgr.registerOracle(ORACLE_OWNER, ADDRESS_ONE, 'ORACLE-A', {
            from: GOVERNOR_OWNER,
        });
        const registered = await this.oracleMgr.isRegistered(ORACLE_OWNER);
        expect(registered).to.be.true;

        const newAddress = toChecksumAddress(padLeft(toHex(10), 40));
        await this.oracleMgr.setOracleAddress(ORACLE_OWNER, newAddress, { from: GOVERNOR_OWNER });

        const changedAddress = await this.oracleMgr.getOracleAddress(ORACLE_OWNER);
        expect(changedAddress).to.equal(newAddress);
    });

    it('Fail to change oracle address', async () => {
        const newAddress = toChecksumAddress(padLeft(toHex(11), 40));
        await expectRevert(
            this.oracleMgr.setOracleAddress(ADDRESS_ONE, newAddress, { from: GOVERNOR_OWNER }),
            'Oracle not registered',
        );
    });

    it('Oracle is not registered', async () => {
        await expectRevert(
            this.oracleMgr.isSubscribed(ADDRESS_ONE, COINPAIR_ID),
            'Oracle is not registered.',
        );
    });

    it('Get oracle round info', async () => {
        const roundInfo = await this.oracleMgr.getOracleRoundInfo(ORACLE_OWNER, COINPAIR_ID);
        expect(roundInfo).to.not.be.undefined;
        expect(roundInfo.points).to.be.bignumber.equal(toBN(0));
        expect(roundInfo.selectedInCurrentRound).to.be.false;
    });

    it('Remove oracle', async () => {
        const registered = await this.oracleMgr.isRegistered(ORACLE_OWNER);
        expect(registered).to.be.true;
        await this.oracleMgr.subscribeToCoinPair(ORACLE_OWNER, COINPAIR_ID, {
            from: GOVERNOR_OWNER,
        });
        const subscribed = await this.oracleMgr.isSubscribed(ORACLE_OWNER, COINPAIR_ID);
        expect(subscribed).to.be.true;
        await this.oracleMgr.removeOracle(ORACLE_OWNER, { from: GOVERNOR_OWNER });
        const unregistered = await this.oracleMgr.isRegistered(ORACLE_OWNER);
        expect(unregistered).to.be.false;
    });

    it('Initialization verifications', async () => {
        const oracleManager = await OracleManager.new();
        await expectRevert(
            oracleManager.initialize(
                this.governor.address, // governor
                MIN_ORACLE_STAKE, // minCPSubscriptionStake
                ADDRESS_ZERO, // stakingContract
                [], // wlist
            ),
            'Staking contract address must be != 0',
        );
        await expectRevert(
            oracleManager.initialize(
                this.governor.address, // governor
                0, // minCPSubscriptionStake
                ADDRESS_ONE, // stakingContract
                [], // wlist
            ),
            'The minimum coin pair subscription stake amount cannot be zero',
        );
    });
});
