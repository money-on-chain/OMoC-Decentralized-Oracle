const helpers = require('./helpers');
const MocRegistryInitChange = artifacts.require('MocRegistryInitChange');
const InfoGetter = artifacts.require('InfoGetter');
const Registry = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedRegistry');

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

        this.infoGetter = await InfoGetter.new();
        await this.infoGetter.initialize(this.governor.address);
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
