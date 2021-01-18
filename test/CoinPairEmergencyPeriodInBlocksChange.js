const helpers = require('./helpers');
const CoinPairEmergencyPeriodInBlocksChange = artifacts.require(
    'CoinPairEmergencyPeriodInBlocksChange',
);

contract('CoinPairEmergencyPeriodInBlocksChange', async (accounts) => {
    const emergencyPublishingPeriodInBlocks = 10;
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

        this.conPairEmergencyPeriodInBlocksChange = await CoinPairEmergencyPeriodInBlocksChange.new(
            this.coinPairPrice_BTCUSD.address,
            emergencyPublishingPeriodInBlocks,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.conPairEmergencyPeriodInBlocksChange);
    });
});
