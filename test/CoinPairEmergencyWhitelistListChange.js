const helpers = require('./helpers');
const { BN } = require('@openzeppelin/test-helpers');
const CoinPairEmergencyWhitelistChange = artifacts.require('CoinPairEmergencyWhitelistChange');
const CoinPairEmergencyWhitelistListChange = artifacts.require(
    'CoinPairEmergencyWhitelistListChange',
);

contract('CoinPairEmergencyWhitelistListChange', async (accounts) => {
    const emergencyPublisher = accounts[7];
    const minCPSubscriptionStake = (10 ** 18).toString();
    const period = 3;
    const governorOwner = accounts[8];

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: governorOwner,
            period,
            minSubscriptionStake: minCPSubscriptionStake,
        });
        Object.assign(this, contracts);

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });

        this.coinPairEmergencyWhitelistChange = await CoinPairEmergencyWhitelistChange.new(
            this.coinPairPrice_BTCUSD.address,
            emergencyPublisher,
        );

        await this.governor.execute(this.coinPairEmergencyWhitelistChange);

        this.coinPairEmergencyWhitelistListChange = await CoinPairEmergencyWhitelistListChange.new(
            this.coinPairPrice_BTCUSD.address,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.coinPairEmergencyWhitelistListChange);
    });

    it('Should get whitelist length', async () => {
        const whitelistLen = await this.coinPairEmergencyWhitelistListChange.getWhiteListLen();
        assert.equal(whitelistLen, '1');
    });

    it('Should get whitelisted at index', async () => {
        const whitelistedAtIndex = await this.coinPairEmergencyWhitelistListChange.getWhiteListAtIndex(
            new BN(0),
        );
        assert.equal(whitelistedAtIndex, emergencyPublisher);
    });
});
