const helpers = require('./helpers');
const PriceProviderRegisterPairChange = artifacts.require('PriceProviderRegisterPairChange');
const PriceProviderRegister = artifacts.require('PriceProviderRegister');
//const IPriceProviderRegisterEntry = artifacts.require('@moc/shared/IPriceProviderRegisterEntry');

contract('PriceProviderRegisterPairChange', async (accounts) => {
    const iPriceProviderRegisterEntryAddr = accounts[7];
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

        this.priceProviderRegister = await PriceProviderRegister.new();
        await this.priceProviderRegister.initialize(this.governor.address);
        //this.iPriceProviderRegisterEntry = await IPriceProviderRegisterEntry.new();

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });

        this.priceProviderRegisterPairChange = await PriceProviderRegisterPairChange.new(
            this.priceProviderRegister.address,
            web3.utils.asciiToHex('BTCUSD'),
            iPriceProviderRegisterEntryAddr,
        );
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.priceProviderRegisterPairChange);
    });
});
