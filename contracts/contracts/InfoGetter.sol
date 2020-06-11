pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./openzeppelin/Initializable.sol";
import "./CoinPairPrice.sol";
import "./OracleManager.sol";
/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract InfoGetter is Initializable {

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
        uint256 lockPeriodEndBlock;
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
        uint256 selectedInRound;
        address addr;
    }

    struct CoinPairPriceUIInfo {
        uint256 round;
        uint256 startBlock;
        uint256 lockPeriodEndBlock;
        uint256 totalPoints;
        CoinPairUIOracleRoundInfo[] info;
        uint256 currentBlock;
        uint256 lastPubBlock;
        bytes32 lastPubBlockHash;
        uint256 validPricePeriodInBlocks;
        uint256 availableRewards;
    }

    function initialize() public initializer {}



    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _coinPairPrice coinPairPrice contract
    */
    function getCoinPairUIInfo(CoinPairPrice _coinPairPrice) public view returns (CoinPairPriceUIInfo memory coinPairPriceUIInfo)
    {
        (uint256 round,uint256 startBlock, uint256 lockPeriodEndBlock,uint256 totalPoints, address[] memory selectedOracles) = _coinPairPrice.getRoundInfo();
        uint256 len = selectedOracles.length;
        CoinPairUIOracleRoundInfo[] memory info = new CoinPairUIOracleRoundInfo[](len);
        for (uint i = 0; i < len; i++) {
            address addr = selectedOracles[i];
            (uint points, uint256 selectedInRound,) = _coinPairPrice.getOracleRoundInfo(addr);
            info[i] = CoinPairUIOracleRoundInfo(points, selectedInRound, addr);
        }
        uint256 lastPublicationBlock = _coinPairPrice.getLastPublicationBlock();
        return CoinPairPriceUIInfo(round, startBlock, lockPeriodEndBlock, totalPoints,
            info, block.number, lastPublicationBlock, blockhash(lastPublicationBlock),
            _coinPairPrice.getValidPricePeriodInBlocks(), _coinPairPrice.getAvailableRewardFees());
    }

    /**
        Return all the information needed by the ui (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _offset take from this offset
        @param _limit take to this limit, limit == 0 => take all
    */
    function getManagerUICoinPairInfo(OracleManager _oracleManager, uint _offset, uint _limit) public view returns (ManagerUICoinPairInfo[] memory info) {
        uint total = _oracleManager.getCoinPairCount();
        if (_limit > total || _limit == 0) {
            _limit = total;
        }
        if (_offset > _limit) {
            _offset = _limit;
        }
        uint cant = (_limit - _offset);
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
    function getManagerUIOracleInfo(OracleManager _oracleManager, address _prevEntry, uint _cant) public view returns (ManagerUIOracleInfo[] memory info, address nextEntry) {
        address addr;
        if (_prevEntry == address(0)) {
            addr = _oracleManager.getRegisteredOracleHead();
        }

        info = new ManagerUIOracleInfo[](_cant);
        for (uint256 i = 0; addr != address(0) && i < _cant; addr = _oracleManager.getRegisteredOracleNext(addr)) {
            (string memory name, uint stake, address owner) = _oracleManager.getOracleRegistrationInfo(addr);
            info[i] = ManagerUIOracleInfo(stake, _oracleManager.token().balanceOf(addr), addr.balance, addr, owner, name);
        }
        nextEntry = addr;
    }

    /**
        Return all the information needed by the oracle server (one call, to avoid a lot of rpc)

        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
    */
    function getOracleServerInfo(OracleManager _oracleManager, CoinPairPrice _coinPairPrice) public view returns (OracleServerInfo memory oracleServerInfo)
    {
        uint256 lastPubBlock = _coinPairPrice.getLastPublicationBlock();
        (bytes32 currentPrice,) = _coinPairPrice.peek();

        (uint256 round, uint256  startBlock, uint256  lockPeriodEndBlock, uint256  totalPoints, address[] memory selectedOracles) = _coinPairPrice.getRoundInfo();

        return OracleServerInfo(round, startBlock, lockPeriodEndBlock, totalPoints,
            _createFullRoundInfo(_oracleManager, _coinPairPrice, selectedOracles),
            uint256(currentPrice), block.number, lastPubBlock, blockhash(lastPubBlock), _coinPairPrice.getValidPricePeriodInBlocks());
    }

    /**
        Create the FullOracleRoundInfo array from slected oracles
        @param _oracleManager oracleManager contract
        @param _coinPairPrice coinPairPrice contract
        @param _selectedOracles selected oracles addresses
    */
    function _createFullRoundInfo(OracleManager _oracleManager, CoinPairPrice _coinPairPrice,
        address[] memory _selectedOracles) public view returns (FullOracleRoundInfo[] memory info)
    {
        uint256 len = _selectedOracles.length;
        info = new FullOracleRoundInfo[](len);
        for (uint i = 0; i < len; i++) {
            (string memory name, uint stake, address owner) = _oracleManager.getOracleRegistrationInfo(_selectedOracles[i]);
            (uint points,,) = _coinPairPrice.getOracleRoundInfo(_selectedOracles[i]);
            info[i] = FullOracleRoundInfo(
                stake,
                points,
                _selectedOracles[i],
                owner,
                name);
        }
        return info;
    }
}
