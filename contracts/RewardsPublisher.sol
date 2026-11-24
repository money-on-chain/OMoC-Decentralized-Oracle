// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {RoundManager} from './RoundManager.sol';
import {IRewardsDistributor} from './interfaces/IRewardsDistributor.sol';
import {IGovernor} from '@moc/periphery/contracts/moc-governance/Governance/IGovernor.sol';
import {IRegistry} from '@moc/periphery/contracts/IRegistry.sol';
import {OracleManager} from './OracleManager.sol';

/// @notice Publishes cumulative rewards epochs authorized by oracle consensus.
/// @dev Distributor owns all rewards state and validates publication rules. This
/// contract never reads it; its own token balance funds only oracle incentives.
contract RewardsPublisher is RoundManager {
    struct EpochData {
        uint256 epoch;
        bytes32 merkleRoot;
        string cid;
        uint256 snapshotBlock;
        uint256 distributedToday;
    }

    IRewardsDistributor public distributor;
    uint256 private minOraclesPerRound;

    event EpochPublished(
        address indexed sender,
        address indexed votedOracle,
        uint256 indexed epoch,
        uint256 blockNumber
    );

    constructor() public initializer {}

    function initialize(
        IGovernor _governor,
        bytes32 _name,
        IRewardsDistributor _distributor,
        address _tokenAddress,
        RoundConfig calldata _roundConfig,
        OracleManager _oracleManager,
        IRegistry _registry,
        uint256 _minOraclesPerRound
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
        distributor = _distributor;
        minOraclesPerRound = _minOraclesPerRound;
        lastPublicationBlock = block.number;
    }

    function getMinOraclesPerRound() public view override returns (uint256) {
        if (minOraclesPerRound != 0) return minOraclesPerRound;
        return super.getMinOraclesPerRound();
    }

    /// @notice Zero restores the registry-driven minimum, as in TasksRunner.
    function setMinOraclesPerRound(uint256 _minimum) external onlyAuthorizedChanger {
        minOraclesPerRound = _minimum;
    }

    /// @notice Hashes exactly the arguments forwarded to Distributor, bound to
    /// this deployment and chain. No Distributor configuration is duplicated.
    function getEpochDataHash(EpochData memory _data) public view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return
            keccak256(
                abi.encode(
                    chainId,
                    address(this),
                    _data.epoch,
                    _data.merkleRoot,
                    keccak256(bytes(_data.cid)),
                    _data.snapshotBlock,
                    _data.distributedToday
                )
            );
    }

    /// @dev Uses CoinPairPrice's V3 envelope: version, name, payload hash,
    /// voted oracle and last publication block (148 bytes, EIP-191).
    /// A Distributor revert rolls back signer activity, nonce and points too.
    function publishEpoch(
        uint256 _version,
        bytes32 _name,
        EpochData memory _data,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external {
        require(
            _blockNumber == lastPublicationBlock,
            'Blocknumber does not match the last publication block'
        );
        require(_name == coinPair, 'Name - contract mismatch');
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                '\x19Ethereum Signed Message:\n148',
                _version,
                _name,
                getEpochDataHash(_data),
                _votedOracle,
                _blockNumber
            )
        );
        _validateExecution(
            ownerAddr,
            _version,
            _votedOracle,
            _blockNumber,
            _sigV,
            _sigR,
            _sigS,
            messageHash
        );

        _publishEpoch(_data, ownerAddr, _votedOracle, _blockNumber);
    }

    function _publishEpoch(
        EpochData memory _data,
        address _ownerAddr,
        address _votedOracle,
        uint256 _blockNumber
    ) internal {
        lastPublicationBlock = block.number;
        distributor.publishEpoch(
            _data.epoch,
            _data.merkleRoot,
            _data.cid,
            _data.snapshotBlock,
            _data.distributedToday
        );
        roundInfo.addPoints(_ownerAddr, 1);
        emit EpochPublished(_ownerAddr, _votedOracle, _data.epoch, _blockNumber);
    }

    function getName() external view returns (bytes32) {
        return coinPair;
    }
    function getLastPublicationBlock() external view returns (uint256) {
        return lastPublicationBlock;
    }

    // Compatibility with the logical coinpair interfaces used by oracle tooling.
    function getValidPricePeriodInBlocks() external pure returns (uint256) {
        return 0;
    }
    function peek() external pure returns (bytes32, bool) {
        return (bytes32(0), true);
    }
    function getPrice() external pure returns (uint256) {
        return 0;
    }

    uint256[50] private __gap;
}
