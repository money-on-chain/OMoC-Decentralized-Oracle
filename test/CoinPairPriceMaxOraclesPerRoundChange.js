const helpers = require('./helpers');
const CoinPairPriceMaxOraclesPerRoundChange = artifacts.require(
    'CoinPairPriceMaxOraclesPerRoundChange',
);

contract('CoinPairPriceMaxOraclesPerRoundChange', async (accounts) => {
    const maxOraclesPerRound = 10;
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

        this.coinPairPriceMaxOraclesPerRoundChange = await CoinPairPriceMaxOraclesPerRoundChange.new(
            this.coinPairPrice_BTCUSD.address,
            maxOraclesPerRound,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.coinPairPriceMaxOraclesPerRoundChange);
    });
});
