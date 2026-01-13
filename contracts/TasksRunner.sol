// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {RoundManager} from "./RoundManager.sol";
import {ITask} from "./interfaces/ITask.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {OracleManager} from "./OracleManager.sol";
import {EnumerableSet} from "@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol";

/// @title TasksRunner
/// @dev This contract manages a set of tasks that can be executed in batches.
///      It allows adding, removing, and executing tasks, as well as checking their availability.
///      Each task must implement the ITask interface, which requires a checkTask function to determine
///      if the task should be executed, and a runTask function that performs the task and returns points earned.
///      The contract also manages the execution of tasks based on signatures from oracles,
///      ensuring that the execution is authorized and valid.
contract TasksRunner is RoundManager {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private tasks;
    uint256 public maxTasksPerBatch;
    uint256 public lastTaskIndex;
    uint256 private minOraclesPerRound; // Optional override to bypass registry-driven minimum oracle quorum.

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
        uint256 points,
        bool success
    );
    event CheckTaskReverted(address task);

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

    /**
     * @notice Initializer
     * @param _governor The governor address.
     * @param _name The name used to identify the contract. Used same as coin pair identifier.
     * @param _tasks The initial list of task addresses to be added.
     * @param _tokenAddress The address of the MOC token to use.
     * @param _maxOraclesPerRound The maximum count of oracles selected to participate each round.
     * @param _maxSubscribedOraclesPerRound The maximum count of subscribed oracles.
     * @param _roundLockPeriod The minimum time span for each round before a new one can be started, in seconds.
     * @param _maxTasksPerBatch The maximum number of tasks to be executed in a single batch.
     * @param _oracleManager The contract of the oracle manager.
     * @param _registry The registry contract
     * @param _minOraclesPerRound The minimum number of oracles required to run tasks. If 0, use registry value.
     */
    function initialize(
        IGovernor _governor,
        bytes32 _name,
        address[] calldata _tasks,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _maxSubscribedOraclesPerRound,
        uint256 _roundLockPeriod,
        uint256 _maxTasksPerBatch,
        OracleManager _oracleManager,
        IRegistry _registry,
        uint256 _minOraclesPerRound
    ) external initializer {
        __RoundManager_init(
            _governor,
            _name,
            _tokenAddress,
            _maxOraclesPerRound,
            _maxSubscribedOraclesPerRound,
            _roundLockPeriod,
            _oracleManager,
            _registry
        );
        for (uint256 i = 0; i < _tasks.length; i++) {
            tasks.add(_tasks[i]);
        }
        lastPublicationBlock = block.number;
        maxTasksPerBatch = _maxTasksPerBatch;
        lastTaskIndex = 0;
        minOraclesPerRound = _minOraclesPerRound;
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
     * @notice Executes tasks based on the provided parameters and signatures.
     * @param _version Version number of message format (3)
     * @param _name The contract name to report (must match this contract)
     * @param _votedOracle The address of the oracle voted as a publisher by the network.
     * @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
     * @param _sigV The array of V-component of Oracle signatures.
     * @param _sigR The array of R-component of Oracle signatures.
     * @param _sigS The array of S-component of Oracle signatures.
     */
    function runTasks(
        uint256 _version,
        bytes32 _name,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external {
        require(_name == coinPair, "Name - contract mismatch");
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        //
        // NOTE: Message Size is 116 = sizeof(uint256) + sizeof(bytes32)
        // + sizeof(address) + sizeof(uint256)
        //
        bytes memory hData = abi.encodePacked(
            "\x19Ethereum Signed Message:\n116",
            _version, // 32
            _name, // 32
            _votedOracle, // 20
            _blockNumber // 32
        );
        _validateExecution(
            ownerAddr,
            _version,
            _votedOracle,
            _blockNumber,
            _sigV,
            _sigR,
            _sigS,
            keccak256(hData)
        );
        (uint256 pointEarned, uint256 coinbaseEarned) = _runTasks(
            ownerAddr,
            _votedOracle,
            _blockNumber
        );
        roundInfo.addPoints(ownerAddr, pointEarned);
        _transfer(ownerAddr, coinbaseEarned);
    }

    /**
     * @notice Runs tasks based on the current state of the contract.
     * @param _ownerAddr The address of the oracle owner.
     * @param _votedOracle The address of the oracle voted as a publisher by the network.
     * @param _blockNumber The block number at which the tasks are being executed.
     * @return pointEarned The total points earned from executing the tasks.
     * @return coinbaseEarned The total coinbase earned from executing the tasks.
     */
    function _runTasks(
        address _ownerAddr,
        address _votedOracle,
        uint256 _blockNumber
    ) internal returns (uint256 pointEarned, uint256 coinbaseEarned) {
        lastPublicationBlock = block.number;

        uint256 startIndex = lastTaskIndex;
        uint256 i = startIndex;
        uint256 executed = 0;
        uint256 taskLength = tasks.length();
        // some tasks may pay the execution fee in coinbase
        uint256 coinbaseBalance = address(this).balance;
        while (executed < maxTasksPerBatch && i != startIndex + taskLength) {
            ITask task = ITask(tasks.at(i % taskLength));

            bool shouldRun = false;

            try task.checkTask() returns (bool result) {
                shouldRun = result;
            } catch {
                emit CheckTaskReverted(address(task));
                shouldRun = false;
            }

            if (shouldRun) {
                bool success;
                uint256 points;
                try task.runTask() returns (uint256 result) {
                    success = true;
                    points = result;
                    pointEarned = pointEarned.add(points);
                } catch {
                    success = false;
                    points = 0;
                }
                emit TaskExecuted(
                    _ownerAddr,
                    _votedOracle,
                    address(task),
                    _blockNumber,
                    points,
                    success
                );
                executed++;
            }

            i++;
        }

        lastTaskIndex = i % taskLength;
        return (pointEarned, address(this).balance.sub(coinbaseBalance));
    }

    /**
     * @notice Checks if any tasks are available to be executed.
     * @return bool indicating whether any tasks are available.
     */
    function areTasksAvailable() external view returns (bool) {
        uint256 taskLength = tasks.length();
        for (uint256 i = 0; i < taskLength; i++) {
            ITask task = ITask(tasks.at(i));
            bool isAvailable;
            try task.checkTask() returns (bool result) {
                isAvailable = result;
            } catch {
                isAvailable = false;
            }
            if (isAvailable) {
                return true;
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
            bool isAvailable;
            try task.checkTask() returns (bool result) {
                isAvailable = result;
            } catch {
                isAvailable = false;
            }
            if (isAvailable) {
                tasksAvailable[i] = address(task);
            }
        }
        return tasksAvailable;
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
