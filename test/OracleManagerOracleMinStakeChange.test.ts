import { expect } from 'chai';
import { network } from 'hardhat';
import { initContracts } from './helpers.js';
import { Deployer, type Viem, type WalletClients } from 'ts-test-helpers';

describe('OracleManagerOracleMinStakeChange', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;

    const minCPSubscriptionStake = 10n ** 18n;
    const period = 3n;

    before(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        contracts = await initContracts(deployer, accounts[8], period, minCPSubscriptionStake);
    });

    it('Should have been initialized ok', async function () {
        const setup = await contracts.oracleMgr.read.getMinCPSubscriptionStake();
        expect(setup).to.equal(minCPSubscriptionStake);
    });

    it('Should succeed execute call', async function () {
        const change = await deployer.deploy('OracleManagerOracleMinStakeChange', [
            contracts.oracleMgr.address,
            1n,
        ]);

        await contracts.governor.execute(change);

        expect(await contracts.oracleMgr.read.getMinCPSubscriptionStake()).to.equal(1n);
    });
});
