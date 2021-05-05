const helpers = require('./helpers');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const OracleManagerOracleMinStakeChange = artifacts.require('OracleManagerOracleMinStakeChange');

contract('OracleManagerOracleMinStakeChange', async (accounts) => {
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
    });

    it('Should have been initialized ok', async () => {
        const setup = await this.oracleMgr.getMinCPSubscriptionStake();
        expect(setup, 'original setup value for min stake is').to.be.bignumber.equal(
            minCPSubscriptionStake,
        );
    });

    it('Should succeed execute call', async () => {
        this.change = await OracleManagerOracleMinStakeChange.new(this.oracleMgr.address, '1');
        await this.governor.execute(this.change);
        const recevied = await this.oracleMgr.getMinCPSubscriptionStake();
        expect(recevied, 'min stake should have changed to 1').to.be.bignumber.equal(new BN(1));
    });
});
