// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {RoundManager} from './RoundManager.sol';
import {ILendingManager} from './interfaces/ILendingManager.sol';
import {IGovernor} from '@moc/periphery/contracts/moc-governance/Governance/IGovernor.sol';
import {IRegistry} from '@moc/periphery/contracts/IRegistry.sol';
import {OracleManager} from './OracleManager.sol';
import {IPriceProvider} from './IPriceProvider.sol';
import {SafeMath} from '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';

/// @title LiquidationEngine
/// @notice Executes lending liquidations chosen by the oracle selected as publisher.
/// @dev Oracle consensus authorizes the publisher and nonce, but does not sign the liquidation batch.
contract LiquidationEngine is RoundManager {
    using SafeMath for uint256;

    uint256 internal constant PRECISION = 10 ** 18;

    struct Pool {
        address tpToken;
        address mocBucket;
        bool enabled;
    }

    struct PoolParams {
        address tpToken;
        address mocBucket;
    }

    struct PoolLiquidations {
        bytes32 poolId;
        address[] users;
    }

    struct LiquidationEngineParams {
        IPriceProvider tokenToCoinbasePriceProvider;
        IPriceProvider baseFeeProvider;
        uint256 sharesCapMultiplier;
        uint256 maxLiquidationsPerBatch;
    }

    ILendingManager public lendingManager;
    mapping(bytes32 => Pool) public pools;
    uint256 private minOraclesPerRound;
    IPriceProvider public tokenToCoinbasePriceProvider;
    IPriceProvider public baseFeeProvider;
    uint256 public sharesCapMultiplier;
    mapping(address => uint256) public oracleOwnerCoinbaseUsed;
    uint256 public maxLiquidationsPerBatch;

    event PoolAdded(bytes32 indexed poolId, address indexed tpToken, address indexed mocBucket);
    event PoolEnabledSet(bytes32 indexed poolId, bool enabled);
    event LiquidationExecuted(bytes32 indexed poolId, address indexed user, bool success);

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

    function initialize(
        IGovernor _governor,
        bytes32 _name,
        ILendingManager _lendingManager,
        PoolParams[] calldata _pools,
        address _tokenAddress,
        RoundConfig calldata _roundConfig,
        OracleManager _oracleManager,
        IRegistry _registry,
        uint256 _minOraclesPerRound,
        LiquidationEngineParams calldata _engineParams
    ) external initializer {
        require(address(_lendingManager) != address(0), 'Lending manager cannot be zero');

        RoundConfig memory roundConfig = _roundConfig;
        __RoundManager_init(
            _governor,
            _name,
            _tokenAddress,
            roundConfig,
            _oracleManager,
            _registry
        );

        lendingManager = _lendingManager;
        for (uint256 i = 0; i < _pools.length; i++) {
            _addPool(_pools[i].tpToken, _pools[i].mocBucket);
        }

        lastPublicationBlock = block.number;
        minOraclesPerRound = _minOraclesPerRound;
        tokenToCoinbasePriceProvider = _engineParams.tokenToCoinbasePriceProvider;
        baseFeeProvider = _engineParams.baseFeeProvider;
        sharesCapMultiplier = _engineParams.sharesCapMultiplier;
        _setMaxLiquidationsPerBatch(_engineParams.maxLiquidationsPerBatch);
    }

    function getMinOraclesPerRound() public view override returns (uint256) {
        if (minOraclesPerRound != 0) {
            return minOraclesPerRound;
        }
        return super.getMinOraclesPerRound();
    }

    function addPool(
        address _tpToken,
        address _mocBucket
    ) external onlyAuthorizedChanger returns (bytes32 poolId) {
        return _addPool(_tpToken, _mocBucket);
    }

    function _addPool(address _tpToken, address _mocBucket) internal returns (bytes32 poolId) {
        require(_tpToken != address(0), 'TP token cannot be zero');
        require(_mocBucket != address(0), 'MOC bucket cannot be zero');
        poolId = getPoolId(_tpToken, _mocBucket);
        require(pools[poolId].tpToken == address(0), 'Pool already registered');
        pools[poolId] = Pool({tpToken: _tpToken, mocBucket: _mocBucket, enabled: true});
        emit PoolAdded(poolId, _tpToken, _mocBucket);
    }

    function setPoolEnabled(bytes32 _poolId, bool _enabled) external onlyAuthorizedChanger {
        require(pools[_poolId].tpToken != address(0), 'Pool not found');
        pools[_poolId].enabled = _enabled;
        emit PoolEnabledSet(_poolId, _enabled);
    }

    function setMinOraclesPerRound(uint256 _minOraclesPerRound) external onlyAuthorizedChanger {
        minOraclesPerRound = _minOraclesPerRound;
    }

    function setTokenToCoinbasePriceProvider(
        IPriceProvider _tokenToCoinbasePriceProvider
    ) external onlyAuthorizedChanger {
        tokenToCoinbasePriceProvider = _tokenToCoinbasePriceProvider;
    }

    function setBaseFeeProvider(IPriceProvider _baseFeeProvider) external onlyAuthorizedChanger {
        baseFeeProvider = _baseFeeProvider;
    }

    function setSharesCapMultiplier(uint256 _sharesCapMultiplier) external onlyAuthorizedChanger {
        sharesCapMultiplier = _sharesCapMultiplier;
    }

    function setMaxLiquidationsPerBatch(
        uint256 _maxLiquidationsPerBatch
    ) external onlyAuthorizedChanger {
        _setMaxLiquidationsPerBatch(_maxLiquidationsPerBatch);
    }

    function _setMaxLiquidationsPerBatch(uint256 _maxLiquidationsPerBatch) internal {
        require(_maxLiquidationsPerBatch > 0, 'Max liquidations per batch must be positive');
        maxLiquidationsPerBatch = _maxLiquidationsPerBatch;
    }

    /// @notice Executes liquidations selected by the authorized publisher.
    /// @dev The signed 116-byte message is version, name, votedOracle and blockNumber.
    function runLiquidations(
        uint256 _version,
        bytes32 _name,
        PoolLiquidations[] calldata _liquidations,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external {
        require(_name == coinPair, 'Name - contract mismatch');
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);

        bytes32 h = keccak256(
            abi.encodePacked(
                '\x19Ethereum Signed Message:\n116',
                _version,
                _name,
                _votedOracle,
                _blockNumber
            )
        );
        _validateExecution(ownerAddr, _version, _votedOracle, _blockNumber, _sigV, _sigR, _sigS, h);

        lastPublicationBlock = block.number;
        (uint256 points, uint256 reimbursableGas) = _runLiquidations(_liquidations);
        require(points > 0, 'No liquidation executed');
        roundInfo.addPoints(ownerAddr, points);

        if (reimbursableGas > 0) {
            uint256 coinbaseUsed = reimbursableGas.mul(_getBaseFee());
            oracleOwnerCoinbaseUsed[ownerAddr] = oracleOwnerCoinbaseUsed[ownerAddr].add(
                coinbaseUsed
            );
        }
    }

    function _runLiquidations(
        PoolLiquidations[] calldata _liquidations
    ) internal returns (uint256 points, uint256 reimbursableGas) {
        uint256 attemptedLiquidations = 0;
        uint256 maxLiquidations = maxLiquidationsPerBatch;
        for (uint256 i = 0; i < _liquidations.length; i++) {
            if (attemptedLiquidations == maxLiquidations) break;

            address[] calldata users = _liquidations[i].users;
            if (users.length == 0) continue;

            bytes32 poolId = _liquidations[i].poolId;
            Pool storage pool = pools[poolId];
            require(pool.enabled, 'Pool unavailable');

            for (uint256 j = 0; j < users.length; j++) {
                if (attemptedLiquidations == maxLiquidations) {
                    return (points, reimbursableGas);
                }
                // Count attempts, not unique users: a position may require repeated partial liquidations.
                attemptedLiquidations = attemptedLiquidations.add(1);

                uint256 initialGas = gasleft();
                bool success;
                try lendingManager.liquidate(users[j], pool.tpToken, pool.mocBucket) {
                    success = true;
                    points = points.add(1);
                    reimbursableGas = reimbursableGas.add(initialGas.sub(gasleft()));
                } catch {
                    success = false;
                }
                emit LiquidationExecuted(poolId, users[j], success);
            }
        }
    }

    function _getBaseFee() internal view returns (uint256) {
        (bytes32 baseFee, ) = baseFeeProvider.peek();
        return uint256(baseFee);
    }

    function _getTokenToCoinbasePrice() internal view returns (uint256) {
        (bytes32 price, ) = tokenToCoinbasePriceProvider.peek();
        return uint256(price);
    }

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

        for (uint256 i = 0; i < roundInfoLength; i++) {
            uint256 pointsReward = _getCappedPointsReward(
                roundInfo.getPoints(oracleOwners[i]),
                availableRewardFees,
                _roundTotalPoints,
                stakes[i],
                totalStake,
                sharesCapMultiplier
            );
            uint256 distAmount = gasRewardByOracle[i].add(pointsReward);
            if (distAmount > 0) {
                require(token.transfer(oracleOwners[i], distAmount), 'Token transfer failed');
                emit OracleRewardTransfer(
                    _roundNumber,
                    oracleOwners[i],
                    oracleOwners[i],
                    distAmount
                );
            }
        }
    }

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

    function getPoolId(address _tpToken, address _mocBucket) public pure returns (bytes32) {
        return keccak256(abi.encode(_tpToken, _mocBucket));
    }

    function getName() external view returns (bytes32) {
        return coinPair;
    }

    function getLastPublicationBlock() external view returns (uint256) {
        return lastPublicationBlock;
    }

    // Legacy function compatible with old MOC Oracle.
    function getValidPricePeriodInBlocks() external pure returns (uint256) {
        return 0;
    }

    // Legacy function compatible with old MOC Oracle.
    function peek() external pure returns (bytes32, bool) {
        return (bytes32(0), true);
    }

    // Legacy function compatible with old MOC Oracle.
    function getPrice() external pure returns (uint256) {
        return 0;
    }

    receive() external payable {}
}
