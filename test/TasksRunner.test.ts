import assert from 'node:assert/strict';
import { expect } from 'chai';
import { network } from 'hardhat';
import { concatHex, numberToHex, parseSignature } from 'viem';
import { encodeCoinPair, initContracts, mineUntilNextRound, waitForEvents } from './helpers.js';
import {
    assertSameAddress,
    ContractOf,
    Deployer,
    type NetworkHelpers,
    type Viem,
    type WalletClients,
} from 'ts-test-helpers';

function buildRunTasksMessage(
    version: bigint,
    coinPair: `0x${string}`,
    tasksFlags: bigint,
    votedOracle: `0x${string}`,
    blockNumber: bigint,
) {
    return {
        version,
        coinPair,
        tasksFlags,
        votedOracle,
        blockNumber,
        encMsg: concatHex([
            numberToHex(version, { size: 32 }),
            coinPair,
            numberToHex(tasksFlags, { size: 32 }),
            votedOracle,
            numberToHex(blockNumber, { size: 32 }),
        ]),
    };
}

describe('TasksRunner', function () {
    const GOVERNOR_OWNER = 0;
    const WHITELISTED_CALLER = 9;
    const ORACLE_OWNER = 1;
    const ORACLE_ACCOUNT = 2;
    const MIN_STAKE = 10n ** 18n;
    const TASKS_PAIR = encodeCoinPair('TASKS');

    let deployer: Deployer;
    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let tasksRunner: ContractOf<'TasksRunner'>;
    let mockTask: any;
    let revertingTask: any;
    let mockTokenToCoinbaseProvider: any;
    let mockBaseFeeProvider: any;

    async function deployFixture() {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        contracts = await initContracts(deployer, accounts[GOVERNOR_OWNER], 20n, MIN_STAKE, [
            accounts[WHITELISTED_CALLER].account!.address,
        ]);

        mockTask = await deployer.deploy('MockTask', [true, 5n]);
        revertingTask = await deployer.deploy('MockRevertingRunTask');
        mockTokenToCoinbaseProvider = await deployer.deploy('MockIPriceProvider', [
            833333333333n,
            true,
            0n,
        ]);
        mockBaseFeeProvider = await deployer.deploy('MockIPriceProvider', [1n, true, 0n]);

        tasksRunner = await deployer.deployProxy('TasksRunner', [
            contracts.governor.address,
            TASKS_PAIR,
            [revertingTask.address, mockTask.address],
            contracts.token.address,
            {
                maxOraclesPerRound: 5n,
                maxSubscribedOraclesPerRound: 10n,
                roundLockPeriod: 60n,
                maxMissedSigRounds: 0n,
            },
            contracts.oracleMgr.address,
            contracts.registry.address,
            1n,
            {
                maxTasksPerBatch: 10n,
                tokenToCoinbasePriceProvider: mockTokenToCoinbaseProvider.address,
                baseFeeProvider: mockBaseFeeProvider.address,
                sharesCapMultiplier: 1n,
            },
        ]);

        await contracts.governor.registerCoinPair(
            contracts.oracleMgr,
            TASKS_PAIR,
            tasksRunner.address,
        );

        await contracts.governor.mint(
            contracts.token.address,
            accounts[ORACLE_OWNER].account!.address,
            MIN_STAKE,
        );
        await contracts.token.write.approve([contracts.staking.address, MIN_STAKE], {
            account: accounts[ORACLE_OWNER].account!,
        });
        await contracts.staking.write.deposit(
            [MIN_STAKE, accounts[ORACLE_OWNER].account!.address],
            {
                account: accounts[ORACLE_OWNER].account!,
            },
        );

        await contracts.oracleMgr.write.registerOracle(
            [
                accounts[ORACLE_OWNER].account!.address,
                accounts[ORACLE_ACCOUNT].account!.address,
                'oracle-a.io',
            ],
            { account: accounts[WHITELISTED_CALLER].account! },
        );
        await contracts.oracleMgr.write.subscribeToCoinPair(
            [accounts[ORACLE_OWNER].account!.address, TASKS_PAIR],
            { account: accounts[WHITELISTED_CALLER].account! },
        );

        await tasksRunner.write.switchRound({ account: accounts[ORACLE_OWNER].account! });
    }

    it('runs tasks with a single selected oracle even when registry minimum is higher', async function () {
        await deployFixture();
        const lastPublicationBlock = await tasksRunner.read.getLastPublicationBlock();
        const tasksFlags = await tasksRunner.read.getTasksAvailableAsFlags();
        const message = buildRunTasksMessage(
            3n,
            TASKS_PAIR,
            tasksFlags,
            accounts[ORACLE_ACCOUNT].account!.address,
            lastPublicationBlock,
        );
        const signature = parseSignature(
            await accounts[ORACLE_ACCOUNT].signMessage({
                account: accounts[ORACLE_ACCOUNT].account!,
                message: { raw: message.encMsg },
            }),
        );
        if (signature.v === undefined) {
            throw new Error('Signature.v is missing');
        }

        const tx = await tasksRunner.write.runTasks(
            [
                message.version,
                message.coinPair,
                message.tasksFlags,
                message.votedOracle,
                message.blockNumber,
                [Number(signature.v)],
                [signature.r],
                [signature.s],
            ],
            { account: accounts[ORACLE_ACCOUNT].account! },
        );

        const events = await waitForEvents(viem, tasksRunner, 'TaskExecuted', tx);
        expect(events).to.have.lengthOf(2);
        const successEvent = events.find((event) => event.args?.success === true);
        const revertingEvent = events.find((event) => event.args?.success === false);
        assert(successEvent);
        assert(revertingEvent);
        assert.equal(successEvent.args?.blockNumber, lastPublicationBlock);
        assert.equal(revertingEvent.args?.blockNumber, lastPublicationBlock);

        assertSameAddress(successEvent.args?.sender, accounts[ORACLE_OWNER].account!.address);
        assertSameAddress(
            successEvent.args?.votedOracle,
            accounts[ORACLE_ACCOUNT].account!.address,
        );
        assertSameAddress(revertingEvent.args?.sender, accounts[ORACLE_OWNER].account!.address);
        assertSameAddress(
            revertingEvent.args?.votedOracle,
            accounts[ORACLE_ACCOUNT].account!.address,
        );
        assertSameAddress(successEvent.args?.task, mockTask.address);
        assertSameAddress(revertingEvent.args?.task, revertingTask.address);

        const roundInfo = await tasksRunner.read.getRoundInfo();
        const selectedOwners = roundInfo[4];
        assert.equal(selectedOwners.length, 1);
        assertSameAddress(selectedOwners[0], accounts[ORACLE_OWNER].account!.address);

        const usedCoinbase = await tasksRunner.read.oracleOwnerCoinbaseUsed([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        assert(usedCoinbase > 0n);
    });

    it('distributes token rewards equivalent to execution coinbase usage on switchRound', async function () {
        await deployFixture();
        const lastPublicationBlock = await tasksRunner.read.getLastPublicationBlock();
        const tasksFlags = await tasksRunner.read.getTasksAvailableAsFlags();
        const message = buildRunTasksMessage(
            3n,
            TASKS_PAIR,
            tasksFlags,
            accounts[ORACLE_ACCOUNT].account!.address,
            lastPublicationBlock,
        );
        const signature = parseSignature(
            await accounts[ORACLE_ACCOUNT].signMessage({
                account: accounts[ORACLE_ACCOUNT].account!,
                message: { raw: message.encMsg },
            }),
        );
        if (signature.v === undefined) {
            throw new Error('Signature.v is missing');
        }

        await tasksRunner.write.runTasks(
            [
                message.version,
                message.coinPair,
                message.tasksFlags,
                message.votedOracle,
                message.blockNumber,
                [Number(signature.v)],
                [signature.r],
                [signature.s],
            ],
            { account: accounts[ORACLE_ACCOUNT].account! },
        );

        const usedBefore = await tasksRunner.read.oracleOwnerCoinbaseUsed([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        assert(usedBefore > 0n);

        const initialOracleBalance = await contracts.token.read.balanceOf([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        await contracts.governor.mint(contracts.token.address, tasksRunner.address, MIN_STAKE);
        await mineUntilNextRound(networkHelpers, viem, tasksRunner);
        await tasksRunner.write.switchRound({ account: accounts[ORACLE_OWNER].account! });

        const finalOracleBalance = await contracts.token.read.balanceOf([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        assert(finalOracleBalance > initialOracleBalance);

        const usedAfter = await tasksRunner.read.oracleOwnerCoinbaseUsed([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        assert(usedAfter < usedBefore);
    });

    it('returns available tasks as bitflags', async function () {
        await deployFixture();
        const flags = await tasksRunner.read.getTasksAvailableAsFlags();
        expect(flags).to.equal(3n);
    });
});
