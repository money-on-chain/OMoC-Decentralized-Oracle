const helpers = require('./helpers');
const MocRegistryEnteringFallbacksAmountsChange = artifacts.require(
    'MocRegistryEnteringFallbacksAmountsChange',
);
const Registry = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedRegistry');

contract('MocRegistryEnteringFallbacksAmountsChange', async (accounts) => {
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

        this.registry = await Registry.new();
        await this.registry.initialize(this.governor.address);

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });

        this.mocRegistryEnteringFallbacksAmountsChange = await MocRegistryEnteringFallbacksAmountsChange.new(
            this.registry.address,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.mocRegistryEnteringFallbacksAmountsChange);
    });
});
