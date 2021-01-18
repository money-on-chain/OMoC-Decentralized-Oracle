const helpers = require('./helpers');
const { expectEvent } = require('@openzeppelin/test-helpers');
const CoinPairEmergencyWhitelistListChange = artifacts.require(
    'CoinPairEmergencyWhitelistListChange',
);

contract('CoinPairEmergencyWhitelistListChange', async (accounts) => {
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

        this.coinPairEmergencyWhitelistListChange = await CoinPairEmergencyWhitelistListChange.new(
            this.coinPairPrice_BTCUSD.address,
        );
    });

    it('Should succeed execute call', async () => {
        let receipt = await this.governor.execute(this.coinPairEmergencyWhitelistListChange);
        expectEvent.inTransaction(
            receipt.tx,
            this.coinPairEmergencyWhitelistListChange,
            'Result',
            {},
        );
    });
});
