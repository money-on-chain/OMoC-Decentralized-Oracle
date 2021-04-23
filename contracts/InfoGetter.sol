// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {IOracleInfoGetter} from "@money-on-chain/omoc-sc-shared/contracts/IOracleInfoGetter.sol";
import {ICoinPairPrice} from "@money-on-chain/omoc-sc-shared/contracts/ICoinPairPrice.sol";
import {IOracleManager} from "@money-on-chain/omoc-sc-shared/contracts/IOracleManager.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/IGovernor.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract InfoGetter is Initializable, Governed, IOracleInfoGetter {
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
    function getCoinPairUIInfo(ICoinPairPrice _coinPairPrice)
        external
        override
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
        uint256 lastPublicationBlock = _coinPairPrice.getLastPublicationBlock();
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
                _coinPairPrice.getValidPricePeriodInBlocks(),
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
        IOracleManager _oracleManager,
        uint256 _offset,
        uint256 _limit
    ) external override view returns (ManagerUICoinPairInfo[] memory info) {
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
        @param _from The index to start from.
        @param _cant Number of items to return.
    */
    function getManagerUIOracleInfo(
        IOracleManager _oracleManager,
        uint256 _from,
        uint256 _cant
    ) external override view returns (ManagerUIOracleInfo[] memory info, address nextEntry) {
        uint256 len = _oracleManager.getRegisteredOraclesLen();
        if (_from >= len) {
            return (info, nextEntry);
        }
        if (_cant > (len - _from)) {
            _cant = len - _from;
        }
        info = new ManagerUIOracleInfo[](_cant);
        for (uint256 i = 0; i < _cant; i++) {
            (address ownerAddr, address oracleAddr, string memory url) = _oracleManager
                .getRegisteredOracleAtIndex(i + _from);
            uint256 stake = _oracleManager.getStake(ownerAddr);
            info[i] = ManagerUIOracleInfo({
                stake: stake,
                mocsBalance: _oracleManager.getStakingContract().getMocToken().balanceOf(
                    oracleAddr
                ),
                basecoinBalance: oracleAddr.balance,
                addr: oracleAddr,
                owner: ownerAddr,
                name: url
            });
        }
        return (info, nextEntry);
    }

    /**
        Return all the information needed by the oracle server (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
    */
    function getOracleServerInfo(IOracleManager _oracleManager, ICoinPairPrice _coinPairPrice)
        external
        override
        view
        returns (OracleServerInfo memory oracleServerInfo)
    {
        uint256 lastPubBlock = _coinPairPrice.getLastPublicationBlock();
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
                _coinPairPrice.getValidPricePeriodInBlocks()
            );
    }

    /**
        Create the FullOracleRoundInfo array from slected oracles
        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
        @param _selectedOracles selected oracles addresses
    */
    function _createFullRoundInfo(
        IOracleManager _oracleManager,
        ICoinPairPrice _coinPairPrice,
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
