// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {RoundManager} from "./RoundManager.sol";
import {ITask} from "./interfaces/ITask.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {OracleManager} from "./OracleManager.sol";
import {IPriceProvider} from "./IPriceProvider.sol";
import {EnumerableSet} from "@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol";

/// @title TasksRunner
/// @dev This contract manages a set of tasks that can be executed in batches.
///      It allows adding, removing, and executing tasks, as well as checking their availability.
///      Each task must implement the ITask interface, which requires a checkTask function to determine
///      if the task should be executed, and a runTask function that performs the task and returns points earned.
///      The contract also manages the execution of tasks based on signatures from oracles,
///      ensuring that the execution is authorized and valid.
///      Checking task availability is expensive to do on-chain, so the list of tasks to be run is ultimately
///      decided by oracle consensus, with help from this contract's public view methods.
///      It is possible, but unlikely, that consensus attempts to run tasks that are not available to run.
contract TasksRunner is RoundManager {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 internal constant PRECISION = 10**18;

    EnumerableSet.AddressSet private tasks;
    uint256 public maxTasksPerBatch;
    uint256 public lastTaskIndex;
    uint256 private minOraclesPerRound; // Optional override to bypass registry-driven minimum oracle quorum.
    IPriceProvider public tokenToCoinbasePriceProvider;
    IPriceProvider public baseFeeProvider;
    uint256 public sharesCapMultiplier;
    mapping(address => uint256) public oracleOwnerCoinbaseUsed;

    struct TasksRunnerParams {
        uint256 maxTasksPerBatch;
        IPriceProvider tokenToCoinbasePriceProvider;
        IPriceProvider baseFeeProvider;
        uint256 sharesCapMultiplier;
    }

    function getMinOraclesPerRound() public view override returns (uint256) {
        if (minOraclesPerRound != 0) {
            return minOraclesPerRound;
        }
        return super.getMinOraclesPerRound();
    }

    event TaskExecuted(
        address sender,
        address votedOracle,
        address task,
        uint256 blockNumber,
        bool success
    );

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

    /**
     * @notice Initializer
     * @param _governor The governor address.
     * @param _name The name used to identify the contract. Used same as coin pair identifier.
     * @param _tasks The initial list of task addresses to be added.
     * @param _tokenAddress The address of the MOC token to use.
     * @param _roundConfig Round-level config values:
     * maxOraclesPerRound, maxSubscribedOraclesPerRound, roundLockPeriod, maxMissedSigRounds.
     * @dev _roundConfig.maxMissedSigRounds defines maximum consecutive rounds without valid signatures
     * before automatic unsubscribe. Set to 0 to disable.
     * @param _oracleManager The contract of the oracle manager.
     * @param _registry The registry contract
     * @param _minOraclesPerRound The minimum number of oracles required to run tasks. If 0, use registry value.
     * @param _tasksRunnerParams TasksRunner-specific config:
     *  - maxTasksPerBatch: The maximum number of tasks to be executed in a single batch.
     *  - tokenToCoinbasePriceProvider: Price provider for token-to-coinbase conversion.
     *  - baseFeeProvider: Price provider for base fee.
     *  - sharesCapMultiplier: Shares cap multiplier used for reward distribution.
     */
    function initialize(
        IGovernor _governor,
        bytes32 _name,
        address[] calldata _tasks,
        address _tokenAddress,
        RoundConfig calldata _roundConfig,
        OracleManager _oracleManager,
        IRegistry _registry,
        uint256 _minOraclesPerRound,
        TasksRunnerParams calldata _tasksRunnerParams
    ) external initializer {
        RoundConfig memory roundConfig = _roundConfig;
        __RoundManager_init(
            _governor,
            _name,
            _tokenAddress,
            roundConfig,
            _oracleManager,
            _registry
        );

        for (uint256 i = 0; i < _tasks.length; i++) {
            tasks.add(_tasks[i]);
        }

        lastPublicationBlock = block.number;
        lastTaskIndex = 0;
        minOraclesPerRound = _minOraclesPerRound;
        maxTasksPerBatch =  _tasksRunnerParams.maxTasksPerBatch;
        tokenToCoinbasePriceProvider = _tasksRunnerParams.tokenToCoinbasePriceProvider;
        baseFeeProvider =  _tasksRunnerParams.baseFeeProvider;
        sharesCapMultiplier = _tasksRunnerParams.sharesCapMultiplier;
    }

    /**
     * @notice adds a new task to the runner.
     * @param _task The address of the task contract to be added.
     * @dev Only callable by an authorized changer.
     */
    function addTask(address _task) external onlyAuthorizedChanger {
        tasks.add(_task);
    }

    /**
     * @notice removes a task from the runner.
     * @param _task The address of the task contract to be removed.
     * @dev Only callable by an authorized changer.
     */
    function removeTask(address _task) external onlyAuthorizedChanger {
        tasks.remove(_task);
    }

    /**
     * @notice Sets the maximum number of tasks that can be executed in a single batch.
     * @param _maxTasksPerBatch The maximum number of tasks to be executed in a single batch.
     * @dev This function can only be called by an authorized changer.
     */
    function setMaxTasksPerBatch(uint256 _maxTasksPerBatch) external onlyAuthorizedChanger {
        maxTasksPerBatch = _maxTasksPerBatch;
    }

    /**
     * @notice Sets the minimum number of oracles required to run tasks.
     * @param _minOraclesPerRound The minimum number of oracles required to run tasks. If 0, use registry value.
     * @dev This function can only be called by an authorized changer.
     */
    function setMinOraclesPerRound(uint256 _minOraclesPerRound) external onlyAuthorizedChanger {
        minOraclesPerRound = _minOraclesPerRound;
    }

    /**
     * @notice Sets the token-to-coinbase price provider.
     * @param _tokenToCoinbasePriceProvider Price provider for token-to-coinbase conversion.
     * @dev This function can only be called by an authorized changer.
     */
    function setTokenToCoinbasePriceProvider(IPriceProvider _tokenToCoinbasePriceProvider)
        external
        onlyAuthorizedChanger
    {
        tokenToCoinbasePriceProvider = _tokenToCoinbasePriceProvider;
    }

    /**
     * @notice Sets the base fee price provider.
     * @param _baseFeeProvider Price provider for base fee.
     * @dev This function can only be called by an authorized changer.
     */
    function setBaseFeeProvider(IPriceProvider _baseFeeProvider) external onlyAuthorizedChanger {
        baseFeeProvider = _baseFeeProvider;
    }

    /**
     * @notice Sets the shares cap multiplier.
     * @param _sharesCapMultiplier Shares cap multiplier used for reward distribution.
     * @dev This function can only be called by an authorized changer.
     */
    function setSharesCapMultiplier(uint256 _sharesCapMultiplier) external onlyAuthorizedChanger {
        sharesCapMultiplier = _sharesCapMultiplier;
    }

    /**
     * @notice Gets the base fee value from the configured price provider.
     * @return baseFee The base fee price value.
     */
    function _getBaseFee() internal view returns (uint256) {
        (bytes32 baseFee, ) = baseFeeProvider.peek();
        return uint256(baseFee);
    }

    /**
     * @notice Gets the token-to-coinbase price from the configured price provider.
     * @return tokenToCoinbasePrice The conversion rate from token units to coinbase units.
     */
    function _getTokenToCoinbasePrice() internal view returns (uint256) {
        (bytes32 price, ) = tokenToCoinbasePriceProvider.peek();
        return uint256(price);
    }

    /**
     * @notice Calculates the token reward for gas used by one oracle owner in the current round.
     * @param oracleOwnerAddr Oracle owner address.
     * @param availableRewardFees Current reward token balance available for distribution.
     * @return tokenReward Amount of tokens to reward for gas usage.
     */
    function _getRewardTokensForGasUsed(
        address oracleOwnerAddr,
        uint256 availableRewardFees
    ) internal returns (uint256) {
        uint256 coinbaseUsed = oracleOwnerCoinbaseUsed[oracleOwnerAddr];
        if (coinbaseUsed == 0) {
            return 0;
        }

        uint256 tokenReward = coinbaseUsed.mul(PRECISION).div(_getTokenToCoinbasePrice());
        if (tokenReward == 0 || tokenReward > availableRewardFees) {
            return 0;
        }
        oracleOwnerCoinbaseUsed[oracleOwnerAddr] = 0;
        return tokenReward;
    }

    /**
     * @notice Executes tasks based on the provided parameters and signatures.
     * @param _version Version number of message format (3)
     * @param _name The contract name to report (must match this contract)
     * @param _tasksFlags Bitflags for tasks to be considered for execution.
     * @param _votedOracle The address of the oracle voted as a publisher by the network.
     * @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
     * @param _sigV The array of V-component of Oracle signatures.
     * @param _sigR The array of R-component of Oracle signatures.
     * @param _sigS The array of S-component of Oracle signatures.
     */
    function runTasks(
        uint256 _version,
        bytes32 _name,
        uint256 _tasksFlags,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external {
        uint256 initialGas = gasleft();
        require(_name == coinPair, "Name - contract mismatch");
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        //
        // NOTE: Message Size is 148 = sizeof(uint256) + sizeof(bytes32)
        // + sizeof(uint256) + sizeof(address) + sizeof(uint256)
        //
        bytes32 h = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n148",
            _version, // 32
            _name, // 32
            _tasksFlags, // 32
            _votedOracle, // 20
            _blockNumber // 32
        ));
        _validateExecution(
            ownerAddr,
            _version,
            _votedOracle,
            _blockNumber,
            _sigV,
            _sigR,
            _sigS,
            h
        );
        _runTasksAndPay(
            ownerAddr,
            _votedOracle,
            _blockNumber,
            _tasksFlags
        );

        // do not pay gas if there was nothing to execute
        if(_tasksFlags > 0){
            uint256 baseFee = _getBaseFee();
            uint256 gasUsed = initialGas.sub(gasleft());
            uint256 coinbaseUsed = gasUsed.mul(baseFee);
            oracleOwnerCoinbaseUsed[ownerAddr] = oracleOwnerCoinbaseUsed[ownerAddr].add(coinbaseUsed);
        }
    }


    function _runTasksAndPay(
        address _ownerAddr,
        address _votedOracle,
        uint256 _blockNumber,
        uint256 _tasksFlags
    ) internal {
        uint256 points = _runTasks(
            _ownerAddr,
            _votedOracle,
            _blockNumber,
            _tasksFlags
        );
        roundInfo.addPoints(_ownerAddr, points);
    }

    /**
     * @notice Runs tasks selected by consensus of OMOC nodes. All tasks are assumed to be available.
     * @param _ownerAddr The address of the oracle owner.
     * @param _votedOracle The address of the oracle voted as a publisher by the network.
     * @param _blockNumber The block number at which the tasks are being executed.
     * @param _tasksFlags Bitflags for tasks to be considered for execution.
     * @return points The total points earned from executing the tasks.
     */
    function _runTasks(
        address _ownerAddr,
        address _votedOracle,
        uint256 _blockNumber,
        uint256 _tasksFlags
    ) internal returns (uint256 points) {
        lastPublicationBlock = block.number;

        uint256 startIndex = lastTaskIndex;
        uint256 i = startIndex;
        uint256 executed = 0;
        uint256 taskLength = tasks.length();
        bool success;
        while (executed < maxTasksPerBatch && i != startIndex + taskLength) {
            if (((_tasksFlags >> (i % taskLength)) & 1) == 1) {
                ITask task = ITask(tasks.at( i % taskLength));
                try task.runTask() {
                    success = true;
                    ++points;
                } catch {
                    success = false;
                }
                emit TaskExecuted(
                    _ownerAddr,
                    _votedOracle,
                    address(task),
                    _blockNumber,
                    success
                );
                ++executed;
            }

            ++i;
        }

        lastTaskIndex = i % taskLength;
        return points;
    }

    /** 
     * @notice Distribute rewards to oracles, taking fees from this smart contract.
     * @dev Overrides RoundManager to:
     *  1. Oracles receive the gas spent to execute the tasks in Tokens
     *  2. Oracles shares are capped depending on their pct of stake
     */
    function _distributeRewards(
        address[] memory _selectedOwners,
        uint256 _roundNumber,
        uint256 _roundTotalPoints
    ) internal override {
        uint256 availableRewardFees = token.balanceOf(address(this));
        if (availableRewardFees == 0) return;

        uint256 roundInfoLength = _selectedOwners.length;
        address[] memory oracleOwners = new address[](roundInfoLength);
        uint256[] memory gasRewardByOracle = new uint256[](roundInfoLength);
        uint256[] memory stakes = new uint256[](roundInfoLength);
        uint256 totalStake = 0;
        OracleManager localOracleManager = oracleManager;
        // cache oracle owners, compute per-oracle gas rewards, and aggregate total stake.
        for (uint256 i = 0; i < roundInfoLength; i++) {
            address oracleOwnerAddr = _selectedOwners[i];
            oracleOwners[i] = oracleOwnerAddr;
            uint256 gasReward = _getRewardTokensForGasUsed(oracleOwnerAddr, availableRewardFees);
            if (gasReward > 0) {
                availableRewardFees = availableRewardFees.sub(gasReward);
                gasRewardByOracle[i] = gasReward;
            }
            uint256 oracleStake = localOracleManager.getStake(oracleOwnerAddr);
            stakes[i] = oracleStake;
            totalStake = totalStake.add(oracleStake);
        }

        uint256 totalPoints = _roundTotalPoints;
        uint256 roundNumber = _roundNumber;
        uint256 localSharesCapMultiplier = sharesCapMultiplier;
        // distribute points rewards (capped by stake share) plus gas rewards.
        for (uint256 i = 0; i < roundInfoLength; i++) {
            uint256 pointsReward = _getCappedPointsReward(
                roundInfo.getPoints(oracleOwners[i]),
                availableRewardFees,
                totalPoints,
                stakes[i],
                totalStake,
                localSharesCapMultiplier
            );
            uint256 distAmount = gasRewardByOracle[i].add(pointsReward);
            if (distAmount > 0) {
                require(token.transfer(oracleOwners[i], distAmount), "Token transfer failed");
                emit OracleRewardTransfer(
                    roundNumber,
                    oracleOwners[i],
                    oracleOwners[i],
                    distAmount
                );
            }
        }
    }

    /**
     * @notice Calculates the points-based reward for one oracle applying the stake-share cap.
     * @dev Returns zero when there are no points, no available fees, or invalid denominators.
     * @param points Oracle points in the current round.
     * @param availableRewardFees Remaining rewards pool after gas reimbursement.
     * @param totalPoints Total points accumulated in the current round.
     * @param stake Oracle stake used to compute its maximum share.
     * @param totalStake Sum of stakes for selected oracle owners.
     * @param capMultiplier Multiplier applied over stake share to cap reward share.
     * @return pointsReward Points-based reward after cap.
     */
    function _getCappedPointsReward(
        uint256 points,
        uint256 availableRewardFees,
        uint256 totalPoints,
        uint256 stake,
        uint256 totalStake,
        uint256 capMultiplier
    ) internal pure returns (uint256) {
        if (points == 0 || totalPoints == 0 || totalStake == 0 || availableRewardFees == 0) {
            return 0;
        }

        uint256 pointsReward = availableRewardFees.mul(points).div(totalPoints);
        uint256 maxShare = stake.mul(capMultiplier).div(totalStake);
        if (maxShare >= PRECISION) {
            return pointsReward;
        }

        uint256 maxReward = availableRewardFees.mul(maxShare).div(PRECISION);
        if (pointsReward > maxReward) {
            return maxReward;
        }
        return pointsReward;
    }

    /**
     * @notice Checks if any tasks are available to be executed.
     * @return bool indicating whether any tasks are available.
     */
    function areTasksAvailable() external view returns (bool) {
        uint256 taskLength = tasks.length();
        for (uint256 i = 0; i < taskLength; i++) {
            ITask task = ITask(tasks.at(i));
            try task.checkTask() returns (bool isAvailable) {
                if (isAvailable) {
                    return true;
                }
            } catch {
                // If checkTask reverts, treat the task as unavailable and continue.
            }
        }
        return false;
    }

    /**
     * @notice Returns a list of all tasks available for execution.
     * @return An array of addresses representing the tasks.
     */
    function getTasksAvailable() external view returns (address[] memory) {
        uint256 taskLength = tasks.length();
        address[] memory tasksAvailable = new address[](taskLength);
        for (uint256 i = 0; i < taskLength; i++) {
            ITask task = ITask(tasks.at(i));
            try task.checkTask() returns (bool isAvailable) {
                if (isAvailable) {
                    tasksAvailable[i] = address(task);
                }
            } catch {
                // If checkTask reverts, treat the task as unavailable and continue.
            }
        }
        return tasksAvailable;
    }

    /**
     * @notice Returns a bitflags value for tasks available for execution.
     * @return Bitflags where each set bit represents an available task index.
     */
    function getTasksAvailableAsFlags() external view returns (uint256) {
        uint256 taskLength = tasks.length();
        uint256 flags = 0;
        for (uint256 i = 0; i < taskLength; i++) {
            ITask task = ITask(tasks.at(i));
            try task.checkTask() returns (bool isAvailable) {
                if (isAvailable) {
                    flags |= (uint256(1) << i);
                }
            } catch {
                // If checkTask reverts, treat the task as unavailable and continue.
            }
        }
        return flags;
    }

    /**
     * @notice Returns a list of all tasks currently registered in the runner.
     * @return An array of addresses representing the tasks.
     */
    function getTasks() external view returns (address[] memory) {
        uint256 taskLength = tasks.length();
        address[] memory taskList = new address[](taskLength);
        for (uint256 i = 0; i < taskLength; i++) {
            taskList[i] = tasks.at(i);
        }
        return taskList;
    }

    /**
     * @notice Returns the number of tasks currently registered in the runner.
     * @return The count of tasks.
     */
    function getTaskCount() external view returns (uint256) {
        return tasks.length();
    }

    /**
     * @notice Returns the address of a task at a specific index.
     * @param _index The index of the task to retrieve.
     * @return The address of the task at the specified index.
     */
    function getTaskAt(uint256 _index) external view returns (address) {
        return tasks.at(_index);
    }

    /**
     * @notice Checks if a specific task is registered in the runner.
     * @param _task The address of the task to check.
     * @return bool indicating whether the task is registered.
     */
    function containsTask(address _task) external view returns (bool) {
        return tasks.contains(_task);
    }

    // Public variable
    function getName() external view returns (bytes32) {
        return coinPair;
    }

    // Public variable
    function getLastPublicationBlock() external view returns (uint256) {
        return lastPublicationBlock;
    }

    // Legacy function compatible with old MOC Oracle.
    function getValidPricePeriodInBlocks() external view returns (uint256) {
        return 0;
    }

    // Legacy function compatible with old MOC Oracle.
    function peek() external view returns (bytes32, bool) {
        return (bytes32(0), true);
    }

    // Legacy function compatible with old MOC Oracle.
    function getPrice() external view returns (uint256) {
        return 0;
    }

    /**
     * @notice allow to receive coinbase
     */
    receive() external payable {}
}
