const helpers = require('./helpers');
const OracleManagerRemoveChange = artifacts.require('OracleManagerRemoveChange');

contract('OracleManagerRemoveChange', async (accounts) => {
    const oracleOwner = accounts[7];
    const oracleAddr = accounts[6];
    const url = 'url';
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

        this.oracleManagerRemoveChange = await OracleManagerRemoveChange.new(
            this.oracleMgr.address,
            oracleOwner,
        );
    });

    it('Should succeed execute call', async () => {
        await this.staking.registerOracle(oracleAddr, url, { from: oracleOwner });
        await this.governor.execute(this.oracleManagerRemoveChange);
    });
});
