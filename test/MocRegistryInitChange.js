const helpers = require('./helpers');
const MocRegistryInitChange = artifacts.require('MocRegistryInitChange');
const InfoGetter = artifacts.require('InfoGetter');
const Registry = artifacts.require('@moc/shared/GovernedRegistry');

contract('MocRegistryInitChange', async (accounts) => {
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

        this.infoGetter = await helpers.deployProxySimple(InfoGetter, [this.governor.address]);

        // Surely in the near future this should also be changed, now not because it would fail.
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

        this.mocRegistryInitChange = await MocRegistryInitChange.new(
            this.registry.address,
            this.delayMachine.address,
            this.oracleMgr.address,
            this.supporters.address,
            this.infoGetter.address,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.mocRegistryInitChange);
    });
});
