const helpers = require('./helpers');
const OracleManagerUnsubscribeChange = artifacts.require('OracleManagerUnsubscribeChange');

contract('OracleManagerUnsubscribeChange', async (accounts) => {
    const minCPSubscriptionStake = (10 ** 18).toString();
    const oracle = {
        owner: accounts[7],
        addr: accounts[6],
        url: 'url',
        stake: minCPSubscriptionStake,
    };
    const url = 'url';
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
        await this.governor.mint(this.token.address, accounts[7], '1800000000000000000000');

        this.oracleManagerUnsubscribeChange = await OracleManagerUnsubscribeChange.new(
            this.oracleMgr.address,
            oracle.owner,
            web3.utils.asciiToHex('BTCUSD'),
        );
    });

    it('Should succeed execute call', async () => {
        await this.staking.registerOracle(oracle.addr, url, { from: oracle.owner });
        await this.token.approve(this.staking.address, oracle.stake, {
            from: oracle.owner,
        });
        await this.staking.deposit(oracle.stake, oracle.owner, {
            from: oracle.owner,
        });
        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracle.owner,
        });
        await this.governor.execute(this.oracleManagerUnsubscribeChange);
    });
});
