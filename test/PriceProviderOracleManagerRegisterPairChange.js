const helpers = require('./helpers');
const PriceProviderOracleManagerRegisterPairChange = artifacts.require(
    'PriceProviderOracleManagerRegisterPairChange',
);
const PriceProviderRegister = artifacts.require('PriceProviderRegister');

contract('PriceProviderOracleManagerRegisterPairChange', async (accounts) => {
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

        this.priceProviderRegister = await helpers.deployProxySimple(PriceProviderRegister, [
            this.governor.address,
        ]);

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });

        this.priceProviderOracleManagerRegisterPairChange =
            await PriceProviderOracleManagerRegisterPairChange.new(
                this.priceProviderRegister.address,
                this.oracleMgr.address,
            );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.priceProviderOracleManagerRegisterPairChange);
    });
});
