const helpers = require('./helpers');
const CoinPairPriceRoundLockPeriodChange = artifacts.require('CoinPairPriceRoundLockPeriodChange');

contract('CoinPairPriceRoundLockPeriodChange', async (accounts) => {
    const roundLockPeriod = 10;
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

        this.coinPairPriceRoundLockPeriodChange = await CoinPairPriceRoundLockPeriodChange.new(
            this.coinPairPrice_BTCUSD.address,
            roundLockPeriod,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.coinPairPriceRoundLockPeriodChange);
    });
});
