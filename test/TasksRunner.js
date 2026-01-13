const helpers = require('./helpers');
const { expectEvent, BN } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

function buildRunTasksMessage(version, coinPair, votedOracle, blockNumber) {
    const encVersion = web3.eth.abi.encodeParameter('uint256', version).substr(2);
    const encCoinpair = web3.eth.abi.encodeParameter('bytes32', coinPair).substr(2);
    const encOracle = votedOracle.substr(2);
    const encBlockNumber = web3.eth.abi.encodeParameter('uint256', blockNumber).substr(2);

    return {
        version,
        coinPair,
        votedOracle,
        blockNumber,
        encMsg: '0x' + encVersion + encCoinpair + encOracle + encBlockNumber,
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
        this.mockTask = await MockTask.new(true, 5);

        const TasksRunner = artifacts.require('TasksRunner');
        this.tasksRunner = await helpers.deployProxySimple(TasksRunner);
        await this.tasksRunner.initialize(
            this.governor.addr,
            TASKS_PAIR,
            [this.mockTask.address],
            this.token.address,
            5,
            10,
            60,
            10,
            this.oracleMgr.address,
            this.registry,
            1,
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
        const message = buildRunTasksMessage(
            3,
            TASKS_PAIR,
            ORACLE_ACCOUNT,
            lastPublicationBlock.toString(),
        );
        const signature = ethers.utils.splitSignature(
            await web3.eth.sign(message.encMsg, ORACLE_ACCOUNT),
        );

        const receipt = await this.tasksRunner.runTasks(
            message.version,
            message.coinPair,
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

        const roundInfo = await this.tasksRunner.getRoundInfo();
        const selectedOwners = roundInfo[4];
        assert.equal(selectedOwners.length, 1);
        assert.equal(selectedOwners[0], ORACLE_OWNER);
    });

    it('handles checkTask revert as unavailable for availability checks', async () => {
        const MockTask = artifacts.require('MockTask');
        const MockRevertingTask = artifacts.require('MockRevertingTask');
        const okTask = await MockTask.new(true, 1);
        const revertingTask = await MockRevertingTask.new();

        const TasksRunner = artifacts.require('TasksRunner');
        const tasksRunner = await helpers.deployProxySimple(TasksRunner);
        await tasksRunner.initialize(
            this.governor.addr,
            TASKS_PAIR,
            [revertingTask.address, okTask.address],
            this.token.address,
            5,
            10,
            60,
            10,
            this.oracleMgr.address,
            this.registry,
            1,
            { from: GOVERNOR_OWNER },
        );

        const available = await tasksRunner.areTasksAvailable();
        assert.equal(available, true);

        const tasksAvailable = await tasksRunner.getTasksAvailable();
        assert.equal(tasksAvailable.length, 2);
        assert.equal(tasksAvailable[0], helpers.ADDRESS_ZERO);
        assert.equal(tasksAvailable[1], okTask.address);
    });
});
