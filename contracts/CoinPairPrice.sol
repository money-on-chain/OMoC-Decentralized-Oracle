// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IPriceProvider} from "@moc/shared/contracts/IPriceProvider.sol";
import {IRegistry} from "@moc/shared/contracts/IRegistry.sol";
import {IPriceProviderRegisterEntry} from "@moc/shared/contracts/IPriceProviderRegisterEntry.sol";
import {SubscribedOraclesLib} from "./libs/SubscribedOraclesLib.sol";
import {OracleManager} from "./OracleManager.sol";
import {RoundManager} from "./RoundManager.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is RoundManager, IPriceProvider, IPriceProviderRegisterEntry {
    using SubscribedOraclesLib for SubscribedOraclesLib.SubscribedOracles;
    using SafeMath for uint256;

    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    event EmergencyPricePublished(
        address sender,
        uint256 price,
        address votedOracle,
        uint256 blockNumber
    );

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

    /// @notice Construct a new contract
    /// @param _governor The governor address.
    /// @param _wlist List of whitelisted contracts (those that can get the price).
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _maxSubscribedOraclesPerRound The maximum count of subscribed oracles
    /// @param _roundLockPeriod The minimum time span for each round before a new one can be started, in secs.
    /// @param _maxMissedSigRounds Maximum consecutive rounds without valid signatures
    ///        before automatic unsubscribe. Set to 0 to disable.
    /// @param _validPricePeriodInBlocks The time span for which the last published price is valid.
    /// @param _emergencyPublishingPeriodInBlocks The number of blocks that must pass after a publication after which
    //          an emergency publishing must be enabled
    /// @param _bootstrapPrice A price to be set as a bootstraping value for this block
    /// @param _oracleManager The contract of the oracle manager.
    function initialize(
        IGovernor _governor,
        address[] calldata _wlist,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _maxSubscribedOraclesPerRound,
        uint256 _roundLockPeriod,
        uint256 _maxMissedSigRounds,
        uint256 _validPricePeriodInBlocks,
        uint256 _emergencyPublishingPeriodInBlocks,
        uint256 _bootstrapPrice,
        OracleManager _oracleManager,
        IRegistry _registry
    ) external initializer {
        __RoundManager_init(
            _governor,
            _coinPair,
            _tokenAddress,
            _maxOraclesPerRound,
            _maxSubscribedOraclesPerRound,
            _roundLockPeriod,
            _maxMissedSigRounds,
            _oracleManager,
            _registry
        );
        require(
            _validPricePeriodInBlocks > 0,
            "The valid price period must be positive and non zero"
        );
        require(
            _emergencyPublishingPeriodInBlocks > 0,
            "The emergency publishing period must be positive and non zero"
        );
        require(_wlist.length != 0, "Whitelist must have at least one element");

        for (uint256 i = 0; i < _wlist.length; i++) {
            pricePeekWhitelistData._addToWhitelist(_wlist[i]);
        }
        validPricePeriodInBlocks = _validPricePeriodInBlocks;
        emergencyPublishingPeriodInBlocks = _emergencyPublishingPeriodInBlocks;
        _publish(_bootstrapPrice);
    }

    /// @notice return the type of provider
    function getPriceProviderType() external override pure returns (IPriceProviderType) {
        return IPriceProviderType.Published;
    }

    /// @notice Publish a price.
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param _sigV The array of V-component of Oracle signatures.
    /// @param _sigR The array of R-component of Oracle signatures.
    /// @param _sigS The array of S-component of Oracle signatures.
    function publishPrice(
        uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[] calldata _sigV,
        bytes32[] calldata _sigR,
        bytes32[] calldata _sigS
    ) external {
        address ownerAddr = oracleManager.getOracleOwner(msg.sender);
        require(_coinpair == coinPair, "Coin pair - contract mismatch");
        require(_price > 0, "Price must be positive and non-zero");
        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData = abi.encodePacked(
            "\x19Ethereum Signed Message:\n148",
            _version,
            _coinpair,
            _price,
            _votedOracle,
            _blockNumber
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
        _publish(_price);
        roundInfo.addPoints(ownerAddr, 1);
        emit PricePublished(ownerAddr, _price, _votedOracle, _blockNumber);
    }

    /// @notice Publish a price without signature validation (when there is an emergecy!!!).
    /// @param _price Price to report.
    function emergencyPublish(uint256 _price)
        external
        onlyWhitelisted(emergencyPublishWhitelistData)
    {
        require(_price > 0, "Price must be positive and non-zero");
        require(
            block.number > lastPublicationBlock + emergencyPublishingPeriodInBlocks,
            "Emergency publish period didn't started"
        );

        _publish(_price);

        emit EmergencyPricePublished(msg.sender, _price, msg.sender, lastPublicationBlock);
    }

    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek()
        external
        override(IPriceProvider)
        view
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (bytes32, bool)
    {
        return (bytes32(currentPrice), _isValid());
    }

    /// @notice Return the current price
    function getPrice()
        external
        override(IPriceProvider)
        view
        whitelistedOrExternal(pricePeekWhitelistData)
        returns (uint256)
    {
        return currentPrice;
    }

    // Return if the price is not expired.
    function getIsValid() external override view returns (bool) {
        return _isValid();
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        override
        view
        returns (
            uint256,
            bool,
            uint256
        )
    {
        return (currentPrice, _isValid(), lastPublicationBlock);
    }

    // Public variable
    function getCoinPair() external view returns (bytes32) {
        return coinPair;
    }

    // Public variable
    function getLastPublicationBlock() external override(IPriceProvider) view returns (uint256) {
        return lastPublicationBlock;
    }

    // Public variable
    function getValidPricePeriodInBlocks() external view returns (uint256) {
        return validPricePeriodInBlocks;
    }

    // Public variable
    function getEmergencyPublishingPeriodInBlocks() external view returns (uint256) {
        return emergencyPublishingPeriodInBlocks;
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    /// @notice return true if the price is valid
    function _isValid() private view returns (bool) {
        require(block.number >= lastPublicationBlock, "Wrong lastPublicationBlock");
        return (block.number - lastPublicationBlock) < validPricePeriodInBlocks;
    }

    // @notice publish a price, called only after verification.
    function _publish(uint256 _price) private {
        lastPublicationBlock = block.number;
        currentPrice = _price;
    }
}
