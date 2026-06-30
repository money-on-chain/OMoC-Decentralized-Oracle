import { expect } from 'chai';
import { network } from 'hardhat';
import { ADDRESS_ONE, ADDRESS_ZERO, addressFromNumber, encodeCoinPair } from './helpers.js';
import {
    assertSameAddress,
    Deployer,
    type WalletClient,
    type WalletClients,
} from 'ts-test-helpers';
import { Address } from 'viem';

describe('OracleManager operations', function () {
    const ORACLE_OWNER = 1;
    const GOVERNOR_OWNER = 8;
    const COINPAIR_NAME = 'BTCUSD';
    const COINPAIR_ID = encodeCoinPair(COINPAIR_NAME);
    const MIN_ORACLE_STAKE = 10n ** 18n;

    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let accounts: WalletClients;
    let contracts: {
        governor: any;
        token: any;
        oracleMgr: any;
        supporters: any;
        delayMachine: any;
        staking: any;
        stakingMock: any;
        votingMachine: any;
        registry: any;
    };

    async function createMockGovernor(owner: WalletClient) {
        const mockGovernor = await deployer.deploy('MockGovernor', [owner.account!.address]);

        return {
            addr: mockGovernor.address,
            address: mockGovernor.address,
            governor: mockGovernor,
        };
    }

    async function createContractsWithMockGovernor(governorOwner: WalletClient) {
        const governor = await createMockGovernor(governorOwner);
        const token = await deployer.deployProxy('GovernedERC20', [governor.address]);
        const oracleMgr = await deployer.deployUninitializedProxy('OracleManager');
        const staking = await deployer.deployUninitializedProxy('Staking');
        const votingMachine = await deployer.deploy('MockVotingMachine', []);
        const delayMachine = await deployer.deployProxy('DelayMachine', [
            governor.address,
            token.address,
            staking.address,
        ]);
        const whitelist = [staking.address, accounts[GOVERNOR_OWNER].account!.address];
        const supporters = await deployer.deployProxy('Supporters', [
            governor.address,
            [...whitelist, oracleMgr.address],
            token.address,
            10n,
        ]);

        await oracleMgr.write.initialize([
            governor.address,
            MIN_ORACLE_STAKE,
            staking.address,
            whitelist,
        ]);

        await staking.write.initialize([
            governor.address,
            supporters.address,
            oracleMgr.address,
            delayMachine.address,
            [votingMachine.address],
            60n * 60n,
        ]);

        const stakingMock = await deployer.deployProxy('StakingMock', [
            staking.address,
            supporters.address,
        ]);
        await votingMachine.write.initialize([staking.address]);
        const registry = await deployer.deployProxy('GovernedRegistry', [governor.address]);

        return {
            governor,
            token,
            oracleMgr,
            supporters,
            delayMachine,
            staking,
            stakingMock,
            votingMachine,
            registry,
        };
    }

    async function registerOracle(oracleAddress: Address = ADDRESS_ONE, name = 'ORACLE-A') {
        await contracts.oracleMgr.write.registerOracle(
            [accounts[ORACLE_OWNER].account!.address, oracleAddress, name],
            { account: accounts[GOVERNOR_OWNER].account! },
        );
    }

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        contracts = await createContractsWithMockGovernor(accounts[GOVERNOR_OWNER]);

        const coinPairPrice = await deployer.deployProxy('CoinPairPrice', [
            contracts.governor.address,
            [accounts[GOVERNOR_OWNER].account!.address],
            COINPAIR_ID,
            ADDRESS_ONE,
            {
                maxOraclesPerRound: 10n,
                maxSubscribedOraclesPerRound: 30n,
                roundLockPeriod: 60n,
                maxMissedSigRounds: 0n,
            },
            3n,
            2n,
            100000000n,
            contracts.oracleMgr.address,
            ADDRESS_ZERO,
        ]);

        await contracts.oracleMgr.write.registerCoinPair([COINPAIR_ID, coinPairPrice.address], {
            account: accounts[GOVERNOR_OWNER].account!,
        });

        await contracts.token.write.mint(
            [accounts[ORACLE_OWNER].account!.address, MIN_ORACLE_STAKE],
            {
                account: accounts[GOVERNOR_OWNER].account!,
            },
        );
        await contracts.token.write.approve([contracts.staking.address, MIN_ORACLE_STAKE], {
            account: accounts[ORACLE_OWNER].account!,
        });
        await contracts.staking.write.deposit(
            [MIN_ORACLE_STAKE, accounts[ORACLE_OWNER].account!.address],
            { account: accounts[ORACLE_OWNER].account! },
        );
    });

    it('Whitelist manipulation', async function () {
        await viem.assertions.revertWith(
            contracts.oracleMgr.write.addToWhitelist([accounts[2].account!.address]),
            'Invalid changer',
        );

        await contracts.oracleMgr.write.addToWhitelist([accounts[2].account!.address], {
            account: accounts[GOVERNOR_OWNER].account!,
        });

        await viem.assertions.revertWith(
            contracts.oracleMgr.write.removeFromWhitelist([accounts[2].account!.address]),
            'Invalid changer',
        );

        await contracts.oracleMgr.write.removeFromWhitelist([accounts[2].account!.address], {
            account: accounts[GOVERNOR_OWNER].account!,
        });
    });

    it('Change oracle address', async function () {
        await registerOracle();
        expect(
            await contracts.oracleMgr.read.isRegistered([accounts[ORACLE_OWNER].account!.address]),
        ).to.equal(true);

        const newAddress = addressFromNumber(10);
        await contracts.oracleMgr.write.setOracleAddress(
            [accounts[ORACLE_OWNER].account!.address, newAddress],
            { account: accounts[GOVERNOR_OWNER].account! },
        );

        const changedAddress = await contracts.oracleMgr.read.getOracleAddress([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        assertSameAddress(changedAddress, newAddress);
    });

    it('Fail to change oracle address', async function () {
        const newAddress = addressFromNumber(11);
        await viem.assertions.revertWith(
            contracts.oracleMgr.write.setOracleAddress([ADDRESS_ONE, newAddress], {
                account: accounts[GOVERNOR_OWNER].account!,
            }),
            'Oracle not registered',
        );
    });

    it('Oracle is not registered', async function () {
        expect(await contracts.oracleMgr.read.isSubscribed([ADDRESS_ONE, COINPAIR_ID])).to.equal(
            false,
        );
    });

    it('Get oracle round info', async function () {
        const [points, selectedInCurrentRound] = await contracts.oracleMgr.read.getOracleRoundInfo([
            accounts[ORACLE_OWNER].account!.address,
            COINPAIR_ID,
        ]);
        expect(points).to.equal(0n);
        expect(selectedInCurrentRound).to.equal(false);
    });

    it('Remove oracle', async function () {
        await registerOracle();
        expect(
            await contracts.oracleMgr.read.isRegistered([accounts[ORACLE_OWNER].account!.address]),
        ).to.equal(true);

        await contracts.oracleMgr.write.subscribeToCoinPair(
            [accounts[ORACLE_OWNER].account!.address, COINPAIR_ID],
            { account: accounts[GOVERNOR_OWNER].account! },
        );
        expect(
            await contracts.oracleMgr.read.isSubscribed([
                accounts[ORACLE_OWNER].account!.address,
                COINPAIR_ID,
            ]),
        ).to.equal(true);

        const stake = await contracts.staking.read.getBalance([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        await contracts.staking.write.withdraw([stake], {
            account: accounts[ORACLE_OWNER].account!,
        });
        expect(
            await contracts.staking.read.getBalance([accounts[ORACLE_OWNER].account!.address]),
        ).to.equal(0n);

        await contracts.oracleMgr.write.removeOracle([accounts[ORACLE_OWNER].account!.address], {
            account: accounts[GOVERNOR_OWNER].account!,
        });
        expect(
            await contracts.oracleMgr.read.isRegistered([accounts[ORACLE_OWNER].account!.address]),
        ).to.equal(false);
    });

    it('Initialization verifications', async function () {
        const oracleManager = await deployer.deployUninitializedProxy('OracleManager');

        await viem.assertions.revertWith(
            oracleManager.write.initialize([
                contracts.governor.address,
                MIN_ORACLE_STAKE,
                ADDRESS_ZERO,
                [],
            ]),
            'Staking contract address must be != 0',
        );

        await viem.assertions.revertWith(
            oracleManager.write.initialize([contracts.governor.address, 0n, ADDRESS_ONE, []]),
            'The minimum coin pair subscription stake amount cannot be zero',
        );
    });
});
