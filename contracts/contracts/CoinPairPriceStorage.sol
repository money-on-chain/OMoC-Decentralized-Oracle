pragma solidity 0.6.0;

import {Initializable} from "./openzeppelin/Initializable.sol";
import {GovernedAbstract} from "./libs/GovernedAbstract.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {OracleManager} from "./OracleManager.sol";

/*
    Abstract contract meant to be reused with all the configurable parameters of CoinPairPrice.
*/
contract CoinPairPriceStorage is Initializable, GovernedAbstract, IIterableWhitelist {

    // Whitelist used to store the addresses of contracts that can peek prices.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // The current price, accessible only by whitelisted contracts.
    uint256 internal currentPrice;

    // The coin-pair for which prices are reported in this contract.
    bytes32 public coinPair;

    // The maximum count of oracles selected to participate each round
    uint256 public maxOraclesPerRound;

    // The duration in blocks before a SwitchRound can occur.
    uint256 public roundLockPeriodInBlocks;

    // The block where the last price publication occurred.
    uint256 public lastPublicationBlock;

    // The amount of block during which a price is considered valid
    uint256 public validPricePeriodInBlocks;

    OracleManager public oracleManager;

    IERC20 public token;

    // The number of rounds an oracle must be idle (not participating) before a removal
    uint8 public numIdleRounds;


    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal {}
    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
