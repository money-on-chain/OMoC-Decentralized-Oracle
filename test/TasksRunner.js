const helpers = require('./helpers');
const { expectEvent, BN } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

function buildRunTasksMessage(version, coinPair, tasksFlags, votedOracle, blockNumber) {
    const encVersion = web3.eth.abi.encodeParameter('uint256', version).substr(2);
    const encCoinpair = web3.eth.abi.encodeParameter('bytes32', coinPair).substr(2);
    const encTasksFlags = web3.eth.abi.encodeParameter('uint256', tasksFlags).substr(2);
    const encOracle = votedOracle.substr(2);
    const encBlockNumber = web3.eth.abi.encodeParameter('uint256', blockNumber).substr(2);

    return {
        version,
        coinPair,
        tasksFlags,
        votedOracle,
        blockNumber,
        encMsg: '0x' + encVersion + encCoinpair + encTasksFlags + encOracle + encBlockNumber,
    };
}

contract('TasksRunner', (accounts) => {
    const GOVERNOR_OWNER = accounts[0];
    const WHITELISTED_CALLER = accounts[9];
    const ORACLE_OWNER = accounts[1];
    const ORACLE_ACCOUNT = accounts[2];
    const MIN_STAKE = new BN('1000000000000000000');
    const TASKS_PAIR = web3.utils.asciiToHex('TASKS');

    beforeEach(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: GOVERNOR_OWNER,
            oracleManagerWhitelisted: [WHITELISTED_CALLER],
            minSubscriptionStake: MIN_STAKE.toString(),
        });
        Object.assign(this, contracts);

        const MockTask = artifacts.require('MockTask');
        const MockRevertingRunTask = artifacts.require('MockRevertingRunTask');
        const MockIPriceProvider = artifacts.require('MockIPriceProvider');
        this.mockTask = await MockTask.new(true, 5);
        this.revertingTask = await MockRevertingRunTask.new();
        this.mockTokenToCoinbaseProvider = await MockIPriceProvider.new(1, true, 0);
        this.mockBaseFeeProvider = await MockIPriceProvider.new(1, true, 0);

        const TasksRunner = artifacts.require('TasksRunner');
        this.tasksRunner = await helpers.deployProxySimple(TasksRunner);
        await this.tasksRunner.initialize(
            this.governor.addr,
            TASKS_PAIR,
            [this.revertingTask.address, this.mockTask.address],
            this.token.address,
            5,
            10,
            60,
            0,
            this.oracleMgr.address,
            this.registry,
            1,
            [
                10,
                this.mockTokenToCoinbaseProvider.address,
                this.mockBaseFeeProvider.address,
                1,
            ],
            { from: GOVERNOR_OWNER },
        );

        await this.governor.registerCoinPair(this.oracleMgr, TASKS_PAIR, this.tasksRunner.address);

        await this.governor.mint(this.token.address, ORACLE_OWNER, MIN_STAKE.toString());
        await this.token.approve(this.staking.address, MIN_STAKE, { from: ORACLE_OWNER });
        await this.staking.deposit(MIN_STAKE, ORACLE_OWNER, { from: ORACLE_OWNER });

        await this.oracleMgr.registerOracle(ORACLE_OWNER, ORACLE_ACCOUNT, 'oracle-a.io', {
            from: WHITELISTED_CALLER,
        });
        await this.oracleMgr.subscribeToCoinPair(ORACLE_OWNER, TASKS_PAIR, {
            from: WHITELISTED_CALLER,
        });

        await this.tasksRunner.switchRound({ from: ORACLE_OWNER });
    });

    it('runs tasks with a single selected oracle even when registry minimum is higher', async () => {
        const lastPublicationBlock = await this.tasksRunner.getLastPublicationBlock();
        const tasksFlags = await this.tasksRunner.getTasksAvailableAsFlags();
        const message = buildRunTasksMessage(
            3,
            TASKS_PAIR,
            tasksFlags.toString(),
            ORACLE_ACCOUNT,
            lastPublicationBlock.toString(),
        );
        const signature = ethers.utils.splitSignature(
            await web3.eth.sign(message.encMsg, ORACLE_ACCOUNT),
        );

        const receipt = await this.tasksRunner.runTasks(
            message.version,
            message.coinPair,
            message.tasksFlags,
            message.votedOracle,
            message.blockNumber,
            [signature.v],
            [signature.r],
            [signature.s],
            { from: ORACLE_ACCOUNT },
        );

        expectEvent(receipt, 'TaskExecuted', {
            sender: ORACLE_OWNER,
            votedOracle: ORACLE_ACCOUNT,
            task: this.mockTask.address,
            blockNumber: lastPublicationBlock,
            points: new BN(5),
            success: true,
        });
        expectEvent(receipt, 'TaskExecuted', {
            sender: ORACLE_OWNER,
            votedOracle: ORACLE_ACCOUNT,
            task: this.revertingTask.address,
            blockNumber: lastPublicationBlock,
            points: new BN(0),
            success: false,
        });

        const roundInfo = await this.tasksRunner.getRoundInfo();
        const selectedOwners = roundInfo[4];
        assert.equal(selectedOwners.length, 1);
        assert.equal(selectedOwners[0], ORACLE_OWNER);

        const usedCoinbase = await this.tasksRunner.oracleOwnerCoinbaseUsed(ORACLE_OWNER);
        assert(usedCoinbase.gt(new BN(0)));
    });

    it('distributes token rewards equivalent to execution coinbase usage on switchRound', async () => {
        const lastPublicationBlock = await this.tasksRunner.getLastPublicationBlock();
        const message = buildRunTasksMessage(
            3,
            TASKS_PAIR,
            ORACLE_ACCOUNT,
            lastPublicationBlock.toString(),
        );
        const signature = ethers.utils.splitSignature(
            await web3.eth.sign(message.encMsg, ORACLE_ACCOUNT),
        );

        await this.tasksRunner.runTasks(
            message.version,
            message.coinPair,
            message.votedOracle,
            message.blockNumber,
            [signature.v],
            [signature.r],
            [signature.s],
            { from: ORACLE_ACCOUNT },
        );

        const usedBefore = await this.tasksRunner.oracleOwnerCoinbaseUsed(ORACLE_OWNER);
        assert(usedBefore.gt(new BN(0)));

        const initialOracleBalance = await this.token.balanceOf(ORACLE_OWNER);
        await this.governor.mint(this.token.address, this.tasksRunner.address, MIN_STAKE.toString());
        await helpers.mineUntilNextRound(this.tasksRunner);
        await this.tasksRunner.switchRound({ from: ORACLE_OWNER });

        const finalOracleBalance = await this.token.balanceOf(ORACLE_OWNER);
        assert(finalOracleBalance.gt(initialOracleBalance));

        const usedAfter = await this.tasksRunner.oracleOwnerCoinbaseUsed(ORACLE_OWNER);
        assert(usedAfter.lt(usedBefore));
    });

    it('returns available tasks as bitflags', async () => {
        const flags = await this.tasksRunner.getTasksAvailableAsFlags();
        assert.equal(flags.toString(), new BN(3).toString());
    });
});
