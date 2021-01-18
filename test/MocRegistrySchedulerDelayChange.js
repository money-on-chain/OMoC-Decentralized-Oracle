const helpers = require('./helpers');
const MocRegistrySchedulerDelayChange = artifacts.require('MocRegistrySchedulerDelayChange');
const Registry = artifacts.require('@moc/shared/GovernedRegistry');

contract('MocRegistrySchedulerDelayChange', async (accounts) => {
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

        this.mocRegistrySchedulerDelayChange = await MocRegistrySchedulerDelayChange.new(
            this.registry.address,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.mocRegistrySchedulerDelayChange);
    });
});
