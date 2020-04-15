pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./openzeppelin/Initializable.sol";
import "./libs/IterableWhitelist.sol";
import "./OracleManager.sol";
import "./moc-gobernanza/Governance/Governed.sol";

/*
    Abstract contract meant to be reused with all the configurable parameters of CoinPairPrice.
*/
contract CoinPairPriceGobernanza is Initializable, Governed, IterableWhitelist {
    using SafeMath for uint;

    // The coin-pair for which prices are reported in this contract.
    bytes32 coinPair;

    // The maximum count of oracles selected to participate each round
    uint256 public maxOraclesPerRound;

    // The number of rounds an oracle must be idle (not participating) before a removal
    uint8 public numIdleRounds;

    // The duration in blocks before a SwitchRound can occur.
    uint256 public roundLockPeriodInBlocks;

    uint256 internal currentPrice;

    IERC20 public token;

    OracleManager public oracleManager;

    // The block where the last price publication occurred.
    uint256 lastPublicationBlock;



    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    /// @notice Construct a new contract
    /// @param _tokenAddress The address of the MOC token to use.
    /// @param _maxOraclesPerRound The maximum count of oracles selected to participate each round
    /// @param _roundLockPeriodInBlocks The minimum time span for each round before a new one can be started, in blocks.
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
        uint256 _bootstrapPrice,
        uint8 _numIdleRounds,
        OracleManager _oracleManager
    ) public initializer
    {
        require(_wlist.length != 0, "Whitelist must have at least one element");
        require(_coinPair != bytes32(0), "Coin pair must be valid");
        require(_tokenAddress != address(0), "The MOC token address must be provided in constructor");
        require(_roundLockPeriodInBlocks > 0, "The round lock period must be positive and non zero");
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(_numIdleRounds >= 1, "The number of rounds an oracle must be idle must be >= 1");

        Governed.initialize(_governor);

        for (uint256 i = 0; i < _wlist.length; i++) {
            super.add(_wlist[i]);
        }
        maxOraclesPerRound = _maxOraclesPerRound;
        roundLockPeriodInBlocks = _roundLockPeriodInBlocks;
        numIdleRounds = _numIdleRounds;
        token = IERC20(_tokenAddress);
        coinPair = _coinPair;
        oracleManager = _oracleManager;
        lastPublicationBlock = block.number;
        currentPrice = _bootstrapPrice;
    }

    /**
     * @dev Add to the list of contracts that can get the price
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        super.add(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can get the price
     * @param  _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        super.remove(_whitelisted);
    }

    /**
     * @dev Sets the coinpair by gobernanza
     * @param  _coinPair - the override coinPair
     */
    function setCoinPair(bytes32 _coinPair) public onlyAuthorizedChanger() {
        coinPair = _coinPair;
    }

    /**
     * @dev Sets the maxOraclesPerRound by gobernanza
     * @param  _maxOraclesPerRound - the override maxOraclesPerRound
     */
    function setMaxOraclesPerRound(uint256 _maxOraclesPerRound) public onlyAuthorizedChanger() {
        maxOraclesPerRound = _maxOraclesPerRound;
    }

    /**
     * @dev Sets the numIdleRounds by gobernanza
     * @param  _numIdleRounds - the override numIdleRounds
     */
    function setNumIdleRounds(uint8 _numIdleRounds) public onlyAuthorizedChanger() {
        numIdleRounds = _numIdleRounds;
    }

    /**
     * @dev Sets the roundLockPeriodInBlocks by gobernanza
     * @param _roundLockPeriodInBlocks - the override roundLockPeriodInBlockss
     */
    function setRoundLockPeriodInBlocks(uint256 _roundLockPeriodInBlocks) public onlyAuthorizedChanger() {
        roundLockPeriodInBlocks = _roundLockPeriodInBlocks;
    }

    /**
     * @dev Sets the current price by gobernanza
     * @param  _currentPrice - the override price
     */
    function setCurrentPrice(uint256 _currentPrice) public onlyAuthorizedChanger() {
        currentPrice = _currentPrice;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
