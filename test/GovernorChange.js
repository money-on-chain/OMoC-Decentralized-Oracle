const helpers = require('./helpers');
const GovernorChange = artifacts.require('GovernorChange');

contract('GovernorChange', async (accounts) => {
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

        this.governorChange = await GovernorChange.new(this.governor.address, [
            this.coinPairPrice_BTCUSD.address,
            this.coinPairPrice_RIFBTC.address,
        ]);
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.governorChange);
    });
});
