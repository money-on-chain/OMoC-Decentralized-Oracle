pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./openzeppelin/Initializable.sol";
import "./CoinPairPrice.sol";
import "./OracleManager.sol";
import "./moc-gobernanza/Governance/Governed.sol";
/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract InfoGetter is Initializable, Governed {
    CoinPairPrice coinPairPrice;
    OracleManager oracleManager;

    struct FullOracleRoundInfo {
        uint256 stake;
        uint256 points;
        uint256 selectedInRound;
        address addr;
        address owner;
        string name;
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


    function initialize(IGovernor _governor, CoinPairPrice _coinPairPrice, OracleManager _oracleManager) public initializer {
        require(address(_coinPairPrice) != address(0), "CoinPairPrice contract address must be != 0");
        require(address(_oracleManager) != address(0), "OracleManager contract address must be != 0");

        Governed.initialize(_governor);
        coinPairPrice = _coinPairPrice;
        oracleManager = _oracleManager;
    }


    /**
     * @dev Sets the CoinPairPrice address by gobernanza
     * @param _coinPairPrice - the override coinPairPrice
     */
    function setCoinPairPriceAddr(CoinPairPrice _coinPairPrice) public onlyAuthorizedChanger() {
        coinPairPrice = _coinPairPrice;
    }


    /**
     * @dev Sets the OracleManager address by gobernanza
     * @param _oracleManager - the override oracleManager
     */
    function setOracleManagerAddr(OracleManager _oracleManager) public onlyAuthorizedChanger() {
        oracleManager = _oracleManager;
    }



    /// @notice Return all the information needed by the ui (one call, to avoid a lot of rpc)
    function getCoinPairUIInfo() public view returns (
        uint256 round, uint256 startBlock, uint256 lockPeriodEndBlock, uint256 totalPoints,
        CoinPairUIOracleRoundInfo[] memory info,
        uint256 currentBlock,
        uint256 lastPubBlock,
        bytes32 lastPubBlockHash,
        uint256 validPricePeriodInBlocks,
        uint256 availableRewards)
    {
        address[] memory selectedOracles;
        (round, startBlock, lockPeriodEndBlock, totalPoints, selectedOracles) = coinPairPrice.getRoundInfo();
        uint256 len = selectedOracles.length;
        info = new CoinPairUIOracleRoundInfo[](len);
        for (uint i = 0; i < len; i++) {
            address addr = selectedOracles[i];
            (uint points, uint256 selectedInRound,) = coinPairPrice.getOracleRoundInfo(addr);
            info[i] = CoinPairUIOracleRoundInfo(points, selectedInRound, addr);
        }
        uint256 lastPublicationBlock = coinPairPrice.getLastPublicationBlock();
        return (round, startBlock, lockPeriodEndBlock, totalPoints,
        info, block.number, lastPublicationBlock, blockhash(lastPublicationBlock),
        coinPairPrice.getValidPricePeriodInBlocks(), coinPairPrice.getAvailableRewardFees());
    }

    /// @notice Return information needed by the ui in one call.
    /// @param offset take from this offset
    /// @param limit take to this limit, limit == 0 => take all
    function getManagerUICoinPairInfo(uint offset, uint limit) public view returns (ManagerUICoinPairInfo[] memory info) {
        uint total = oracleManager.getCoinPairCount();
        if (limit > total || limit == 0) {
            limit = total;
        }
        if (offset > limit) {
            offset = limit;
        }
        uint cant = (limit - offset);
        info = new ManagerUICoinPairInfo[](cant);
        for (uint256 i = 0; i < cant; i++) {
            bytes32 cp = oracleManager.getCoinPairAtIndex(i + offset);
            info[i] = ManagerUICoinPairInfo(oracleManager.getContractAddress(cp), cp);
        }
    }

    /// @notice Return information needed by the ui in one call.
    /// @param prevEntry The address the entry to start iterating.
    /// @param cant Number of items to return.
    function getManagerUIOracleInfo(address prevEntry, uint cant) public view returns (ManagerUIOracleInfo[] memory info, address nextEntry) {
        address addr;
        if (prevEntry == address(0)) {
            addr = oracleManager.getRegisteredOracleHead();
        }

        info = new ManagerUIOracleInfo[](cant);
        for (uint256 i = 0; addr != address(0) && i < cant; addr = oracleManager.getRegisteredOracleNext(addr)) {
            (string memory name, uint stake, address owner) = oracleManager.getOracleRegistrationInfo(addr);
            info[i] = ManagerUIOracleInfo(stake, oracleManager.token().balanceOf(addr), addr.balance, addr, owner, name);
        }
        nextEntry = addr;
    }

    /// @notice Return all the information needed by the oracle server (one call, to avoid a lot of rpc)
    function getOracleServerInfo() public view returns (
        uint256 round, uint256 startBlock, uint256 lockPeriodEndBlock, uint256 totalPoints,
        FullOracleRoundInfo[] memory info,
        uint256 price,
        uint256 currentBlock,
        uint256 lastPubBlock,
        bytes32 lastPubBlockHash,
        uint256 validPricePeriodInBlocks
    )
    {
        address[] memory selectedOracles;
        (round, startBlock, lockPeriodEndBlock, totalPoints, selectedOracles) = coinPairPrice.getRoundInfo();
        uint256 len = selectedOracles.length;
        info = new FullOracleRoundInfo[](len);
        for (uint i = 0; i < len; i++) {
            address addr = selectedOracles[i];
            (string memory name, uint stake, address owner) = oracleManager.getOracleRegistrationInfo(addr);
            (uint points, uint256 selectedInRound,) = coinPairPrice.getOracleRoundInfo(addr);
            info[i] = FullOracleRoundInfo(
                stake,
                points,
                selectedInRound,
                addr,
                owner,
                name);
        }
        uint256 lastPublicationBlock = coinPairPrice.getLastPublicationBlock();
        validPricePeriodInBlocks = coinPairPrice.getValidPricePeriodInBlocks();
        (bytes32 currentPrice,) = coinPairPrice.peek();
        return (round, startBlock, lockPeriodEndBlock, totalPoints,
        info, uint256(currentPrice), block.number, lastPublicationBlock, blockhash(lastPublicationBlock), validPricePeriodInBlocks);
    }


}
