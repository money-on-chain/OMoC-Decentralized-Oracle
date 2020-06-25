pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {IPriceProvider} from "./libs/IPriceProvider.sol";
import {CoinPairPriceStorage} from "./CoinPairPriceStorage.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {IPriceProviderRegisterEntry} from "./libs/IPriceProviderRegisterEntry.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {OracleManager} from "./OracleManager.sol";
import {IterableWhitelistLib} from "./libs/IterableWhitelistLib.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is CoinPairPriceStorage, IPriceProvider, IPriceProviderRegisterEntry {
    using SafeMath for uint;

    // The publish message has a version field
    uint256 constant PUBLISH_MESSAGE_VERSION = 3;

    // Contract configuration
    // ----------------------------------------------------------------------------------------------------------------

    // The subscribed oracles to this coin-pair.
    mapping(address => bool) internal subscribedOracles;

    struct Round
    {
        // Number of this round
        uint256 number;

        // Total points accumulated in round.
        uint256 totalPoints;

        // The starting block of period where this round is valid.
        uint256 startBlock;

        // The  block (inclusive) where this round lock terminates (can be switched out).
        uint256 lockPeriodEndBlock;

        // The selected oracles that participate in this round.
        address[] selectedOracles;
    }

    Round currentRound;
    mapping(address => OracleInfoLib.OracleRoundInfo) oracleRoundInfo;

    using OracleInfoLib for OracleInfoLib.OracleRoundInfo;

    event OracleRewardTransfer(uint256 roundNumber, address oracleAddress, address toOwnerAddress, uint256 amount);
    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    event NewRound(address caller, uint256 number, uint256 totalPoints, uint256 startBlock, uint256 lockPeriodEndBlock,
        address[] selectedOracles);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------


    /// @notice Construct a new contract
    /// @param _governor The governor address.
    /// @param _wlist List of whitelisted contracts (those that can get the price).
    /// @param _coinPair The coinpair, ex: USDBTC.
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _roundLockPeriodInBlocks The minimum time span for each round before a new one can be started, in blocks.
    /// @param _validPricePeriodInBlocks The time span for which the last published price is valid.
    /// @param _bootstrapPrice A price to be set as a bootstraping value for this block
    /// @param _numIdleRounds The number of rounds an oracle must be idle (not participating) before a removal
    /// @param _oracleManager The contract of the oracle manager.
    function initialize(
        IGovernor _governor,
        address[] memory _wlist,
        bytes32 _coinPair,
        address _tokenAddress,
        uint256 _maxOraclesPerRound,
        uint256 _roundLockPeriodInBlocks,
        uint256 _validPricePeriodInBlocks,
        uint256 _bootstrapPrice,
        uint8 _numIdleRounds,
        OracleManager _oracleManager
    ) public initializer
    {
        require(_wlist.length != 0, "Whitelist must have at least one element");
        require(_coinPair != bytes32(0), "Coin pair must be valid");
        require(_tokenAddress != address(0), "The MOC token address must be provided in constructor");
        require(_roundLockPeriodInBlocks > 0, "The round lock period must be positive and non zero");
        require(_validPricePeriodInBlocks > 0, "The valid price period must be positive and non zero");
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(_numIdleRounds >= 1, "The number of rounds an oracle must be idle must be >= 1");

        Governed._initialize(_governor);

        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
        maxOraclesPerRound = _maxOraclesPerRound;
        roundLockPeriodInBlocks = _roundLockPeriodInBlocks;
        validPricePeriodInBlocks = _validPricePeriodInBlocks;
        numIdleRounds = _numIdleRounds;
        token = IERC20(_tokenAddress);
        coinPair = _coinPair;
        oracleManager = _oracleManager;
        lastPublicationBlock = block.number;
        currentPrice = _bootstrapPrice;
    }

    /// @notice return the type of provider
    function getPriceProviderType() external override pure returns (IPriceProviderType) {
        return IPriceProviderType.Published;
    }

    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(subscribedOracles[oracleAddr] == false, "Oracle is already subscribed to this coin pair");

        subscribedOracles[oracleAddr] = true;
        if (currentRound.selectedOracles.length < maxOraclesPerRound
        && currentRound.number > 0
            && !(oracleRoundInfo[oracleAddr].isInRound(currentRound.number))) {
            _addOracleToRound(oracleAddr);
        }
    }

    /// @notice Unsubscribe an oracle from this coin pair , disallowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(subscribedOracles[oracleAddr] == true, "Oracle is not subscribed to this coin pair");

        subscribedOracles[oracleAddr] = false;
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleAddr) external view returns (bool) {
        return subscribedOracles[oracleAddr];
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) public view returns (bool) {
        OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[oracleAddr];
        if (data.getSelectedInRound() == 0) return true;
        return currentRound.number - data.getSelectedInRound() >= numIdleRounds;
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Publish a price.
    /// @param _version Version number of message format (3)
    /// @param _coinpair The coin pair to report (must match this contract)
    /// @param _price Price to report.
    /// @param _votedOracle The address of the oracle voted as a publisher by the network.
    /// @param _blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param _sig_v The array of V-component of Oracle signatures.
    /// @param _sig_r The array of R-component of Oracle signatures.
    /// @param _sig_s The array of S-component of Oracle signatures.
    function publishPrice(uint256 _version,
        bytes32 _coinpair,
        uint256 _price,
        address _votedOracle,
        uint256 _blockNumber,
        uint8[]  memory _sig_v,
        bytes32[] memory _sig_r,
        bytes32[] memory _sig_s) public {

        require(currentRound.number > 0, "Round not open");
        OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[msg.sender];
        require(subscribedOracles[msg.sender], "Sender oracle not subscribed");
        require(data.isInRound(currentRound.number), "Voter oracle is not part of this round");
        require(msg.sender == _votedOracle, "Your address does not match the voted oracle");
        require(_version == PUBLISH_MESSAGE_VERSION, "This contract accepts only V3 format");
        require(_price > 0, "Price must be positive and non-zero");
        require(_blockNumber == lastPublicationBlock, "Blocknumber does not match the last publication block");
        require(_coinpair == coinPair, "Coin pair - contract mismatch");

        // Verify signatures
        require(_sig_s.length == _sig_r.length && _sig_r.length == _sig_v.length, "Inconsistent signature count");
        require(_sig_s.length > currentRound.selectedOracles.length / 2,
            "Signature count must exceed 50% of active oracles");

        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData = abi.encodePacked("\x19Ethereum Signed Message:\n148",
            _version, _coinpair, _price, _votedOracle, _blockNumber);
        bytes32 messageHash = keccak256(hData);

        address lastAddr = address(0);
        for (uint i = 0; i < _sig_s.length; i++) {
            address rec = _recoverSigner(_sig_v[i], _sig_r[i], _sig_s[i], messageHash);
            require(rec != address(0), "Cannot recover signature");
            require(subscribedOracles[rec], "Signing oracle not subscribed");
            require(oracleRoundInfo[rec].isInRound(currentRound.number), "Address of signer not part of this round");
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        oracleRoundInfo[msg.sender].addPoints(1);
        currentRound.totalPoints = currentRound.totalPoints + 1;
        lastPublicationBlock = block.number;
        currentPrice = _price;

        emit PricePublished(msg.sender, _price, _votedOracle, _blockNumber);
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek() public override view whitelistedOrExternal(iterableWhitelistData) returns (bytes32, bool) {
        require(block.number >= lastPublicationBlock, "Wrong lastPublicationBlock");

        return (bytes32(currentPrice), (block.number - lastPublicationBlock) < validPricePeriodInBlocks);
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function getPrice() external view returns (uint256) {
        (bytes32 cp,) = peek();
        return uint256(cp);
    }

    /// @notice Return current round information
    function getRoundInfo() public view returns (uint256 round,
        uint256 startBlock,
        uint256 lockPeriodEndBlock,
        uint256 totalPoints,
        address[] memory selectedOracles) {
        return (currentRound.number, currentRound.startBlock, currentRound.lockPeriodEndBlock,
        currentRound.totalPoints, currentRound.selectedOracles);
    }

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(address addr) public view returns (uint points, uint256 selectedInRound,
        bool selectedInCurrentRound) {
        return (oracleRoundInfo[addr].points, oracleRoundInfo[addr].selectedInRound,
        oracleRoundInfo[addr].selectedInRound == currentRound.number);
    }

    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    function switchRound() public {
        if (currentRound.number > 0) // Not before the first round
        {
            require(block.number > currentRound.lockPeriodEndBlock, "The current round lock period is active");
            _distributeRewards();
        }

        _clearOracleState();

        // Setup new round parameters

        currentRound.number = currentRound.number + 1;
        currentRound.totalPoints = 0;
        currentRound.startBlock = block.number + 1;
        currentRound.lockPeriodEndBlock = block.number + 1 + roundLockPeriodInBlocks;

        // Select top stake oracles to participate on this round

        _selectOraclesForRound();

        emit NewRound(msg.sender, currentRound.number, currentRound.totalPoints, currentRound.startBlock,
            currentRound.lockPeriodEndBlock, currentRound.selectedOracles);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    function _clearOracleState() private {
        for (uint i = 0; i < currentRound.selectedOracles.length; i++) {
            OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[currentRound.selectedOracles[i]];
            data.clearPoints();
        }
    }

    /// @notice Distribute rewards to oracles, taking fees from this smart contract.
    function _distributeRewards() private {
        require(currentRound.number > 0, "round number must be >0");

        uint256 availableRewardFees = token.balanceOf(address(this));
        if (currentRound.totalPoints == 0 || availableRewardFees == 0)
            return;

        // Distribute according to points/TotalPoints ratio
        uint256 distSum = 0;
        for (uint i = 0; i < currentRound.selectedOracles.length; i++) {
            address oracleAddr = currentRound.selectedOracles[i];
            uint256 points = oracleRoundInfo[oracleAddr].points;
            uint256 distAmount = ((points).mul(availableRewardFees)).div(currentRound.totalPoints);
            (,, address owneraddr) = oracleManager.getOracleRegistrationInfo(oracleAddr);

            require(token.transfer(owneraddr, distAmount), "Token transfer failed");
            distSum = distSum.add(distAmount);
            emit OracleRewardTransfer(currentRound.number, oracleAddr, owneraddr, distAmount);
        }
    }

    /// @notice Select top-stakers for the current round. Only subscribed oracles to this contract are
    /// considered for selection.
    function _selectOraclesForRound() private {

        delete currentRound.selectedOracles;
        for (address addr = oracleManager.getRegisteredOracleHead();
            addr != address(0) && currentRound.selectedOracles.length < maxOraclesPerRound;
            addr = oracleManager.getRegisteredOracleNext(addr))
        {
            if (subscribedOracles[addr]) {
                _addOracleToRound(addr);
            }
        }
    }

    function _addOracleToRound(address addr) internal {
        currentRound.selectedOracles.push(addr);
        oracleRoundInfo[addr].setSelectedInRound(currentRound.number);
    }

    /// @notice Recover signer address from v,r,s signature components and hash
    ///
    function _recoverSigner(uint8 v, bytes32 r, bytes32 s, bytes32 hash) internal pure returns (address) {
        uint8 v0 = v;

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v0 < 27) {
            v0 += 27;
        }

        // If the version is correct return the signer address
        if (v0 != 27 && v0 != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v0, r, s);
        }
    }
}
