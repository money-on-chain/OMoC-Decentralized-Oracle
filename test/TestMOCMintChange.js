const helpers = require('./helpers');
const TestMOCMintChange = artifacts.require('TestMOCMintChange');

contract('TestMOCMintChange', async (accounts) => {
    const user = accounts[7];
    const minCPSubscriptionStake = (10 ** 18).toString();
    const amount = minCPSubscriptionStake;
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

        this.testMOCMintChange = await TestMOCMintChange.new(this.token.address, user, amount);
    });

    it('Should succeed execute call', async () => {
        await this.governor.execute(this.testMOCMintChange);
    });
});
