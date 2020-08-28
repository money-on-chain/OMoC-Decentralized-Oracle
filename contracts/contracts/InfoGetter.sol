// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {OracleManager} from "./OracleManager.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract InfoGetter is Initializable, GovernedAbstract {
    struct FullOracleRoundInfo {
        uint256 stake;
        uint256 points;
        address addr;
        address owner;
        string name;
    }

    struct OracleServerInfo {
        uint256 round;
        uint256 startBlock;
        uint256 lockPeriodTimestamp;
        uint256 totalPoints;
        FullOracleRoundInfo[] info;
        uint256 price;
        uint256 currentBlock;
        uint256 lastPubBlock;
        bytes32 lastPubBlockHash;
        uint256 validPricePeriodInBlocks;
    }

    struct ManagerUIOracleInfo {
        uint256 stake;
        uint256 mocsBalance;
        uint256 basecoinBalance;
        address addr;
        address owner;
        string name;
    }

    struct ManagerUICoinPairInfo {
        address addr;
        bytes32 coinPair;
    }

    struct CoinPairUIOracleRoundInfo {
        uint256 points;
        bool selectedInRound;
        address addr;
    }

    struct CoinPairPriceUIInfo {
        uint256 round;
        uint256 startBlock;
        uint256 lockPeriodTimestamp;
        uint256 totalPoints;
        CoinPairUIOracleRoundInfo[] info;
        uint256 currentBlock;
        uint256 lastPubBlock;
        bytes32 lastPubBlockHash;
        uint256 validPricePeriodInBlocks;
        uint256 availableRewards;
    }

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _coinPairPrice coinPairPrice contract
    */
    function getCoinPairUIInfo(CoinPairPrice _coinPairPrice)
        external
        view
        returns (CoinPairPriceUIInfo memory coinPairPriceUIInfo)
    {
        (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            ,
            address[] memory selectedOracles
        ) = _coinPairPrice.getRoundInfo();
        uint256 len = selectedOracles.length;
        CoinPairUIOracleRoundInfo[] memory info = new CoinPairUIOracleRoundInfo[](len);
        for (uint256 i = 0; i < len; i++) {
            address addr = selectedOracles[i];
            (uint256 points, bool selectedInRound) = _coinPairPrice.getOracleRoundInfo(addr);
            info[i] = CoinPairUIOracleRoundInfo(points, selectedInRound, addr);
        }
        uint256 lastPublicationBlock = _coinPairPrice.lastPublicationBlock();
        return
            CoinPairPriceUIInfo(
                round,
                startBlock,
                lockPeriodTimestamp,
                totalPoints,
                info,
                block.number,
                lastPublicationBlock,
                blockhash(lastPublicationBlock),
                _coinPairPrice.validPricePeriodInBlocks(),
                _coinPairPrice.getAvailableRewardFees()
            );
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _offset take from this offset
        @param _limit take to this limit, limit == 0 => take all
    */
    function getManagerUICoinPairInfo(
        OracleManager _oracleManager,
        uint256 _offset,
        uint256 _limit
    ) external view returns (ManagerUICoinPairInfo[] memory info) {
        uint256 total = _oracleManager.getCoinPairCount();
        if (_limit > total || _limit == 0) {
            _limit = total;
        }
        if (_offset > _limit) {
            _offset = _limit;
        }
        uint256 cant = (_limit - _offset);
        info = new ManagerUICoinPairInfo[](cant);
        for (uint256 i = 0; i < cant; i++) {
            bytes32 cp = _oracleManager.getCoinPairAtIndex(i + _offset);
            info[i] = ManagerUICoinPairInfo(_oracleManager.getContractAddress(cp), cp);
        }
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _prevEntry The address the entry to start iterating.
        @param _cant Number of items to return.
    */
    function getManagerUIOracleInfo(
        OracleManager _oracleManager,
        address _prevEntry,
        uint256 _cant
    ) external view returns (ManagerUIOracleInfo[] memory info, address nextEntry) {
        /*address addr;
        if (_prevEntry == address(0)) {
            addr = _oracleManager.getRegisteredOracleHead();
        }

        info = new ManagerUIOracleInfo[](_cant);
        for (
            uint256 i = 0;
            addr != address(0) && i < _cant;
            addr = _oracleManager.getRegisteredOracleNext(addr)
        ) {
            (string memory name, uint256 stake, address owner) = _oracleManager
                .getOracleRegistrationInfo(addr);
            info[i] = ManagerUIOracleInfo(
                stake,
                _oracleManager.token().balanceOf(addr),
                addr.balance,
                addr,
                owner,
                name
            );
        }
        nextEntry = addr;*/
    }

    /**
        Return all the information needed by the oracle server (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
    */
    function getOracleServerInfo(OracleManager _oracleManager, CoinPairPrice _coinPairPrice)
        external
        view
        returns (OracleServerInfo memory oracleServerInfo)
    {
        uint256 lastPubBlock = _coinPairPrice.lastPublicationBlock();
        (bytes32 currentPrice, ) = _coinPairPrice.peek();

        (
            uint256 round,
            uint256 startBlock,
            uint256 lockPeriodTimestamp,
            uint256 totalPoints,
            ,
            address[] memory selectedOracles
        ) = _coinPairPrice.getRoundInfo();

        return
            OracleServerInfo(
                round,
                startBlock,
                lockPeriodTimestamp,
                totalPoints,
                _createFullRoundInfo(_oracleManager, _coinPairPrice, selectedOracles),
                uint256(currentPrice),
                block.number,
                lastPubBlock,
                blockhash(lastPubBlock),
                _coinPairPrice.validPricePeriodInBlocks()
            );
    }

    /**
        Create the FullOracleRoundInfo array from slected oracles
        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
        @param _selectedOracles selected oracles addresses
    */
    function _createFullRoundInfo(
        OracleManager _oracleManager,
        CoinPairPrice _coinPairPrice,
        address[] memory _selectedOracles
    ) private view returns (FullOracleRoundInfo[] memory info) {
        uint256 len = _selectedOracles.length;
        info = new FullOracleRoundInfo[](len);
        for (uint256 i = 0; i < len; i++) {
            address owner = _oracleManager.getOracleOwner(_selectedOracles[i]);
            (string memory name, uint256 stake, ) = _oracleManager.getOracleRegistrationInfo(owner);
            (uint256 points, ) = _coinPairPrice.getOracleRoundInfo(_selectedOracles[i]);
            info[i] = FullOracleRoundInfo(stake, points, _selectedOracles[i], owner, name);
        }
        return info;
    }
}
