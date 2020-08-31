// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {RoundInfoLib} from "./libs/RoundInfoLib.sol";
import {SubscribedOraclesLib} from "./libs/SubscribedOraclesLib.sol";
import {OracleManager} from "./OracleManager.sol";

/*
    Abstract contract meant to be reused with all the configurable parameters of CoinPairPrice.
*/
contract CoinPairPriceStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using RoundInfoLib for RoundInfoLib.RoundInfo;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // The publish message has a version field
    uint256 constant PUBLISH_MESSAGE_VERSION = 3;

    // Maximum number of subscribed oracles.
    uint256 maxSubscribedOraclesPerRound;

    // Round information.
    RoundInfoLib.RoundInfo internal roundInfo;

    // The subscribed oracles to this coin-pair.
    SubscribedOraclesLib.SubscribedOracles internal subscribedOracles;

    // Whitelist used to store the addresses of contracts that can peek prices.
    IterableWhitelistLib.IterableWhitelistData internal pricePeekWhitelistData;

    // Whitelist used for emergency price publishing
    IterableWhitelistLib.IterableWhitelistData internal emergencyPublishWhitelistData;

    // The current price, accessible only by whitelisted contracts.
    uint256 internal currentPrice;

    // The coin-pair for which prices are reported in this contract.
    bytes32 public coinPair;

    // The block where the last price publication occurred.
    uint256 public lastPublicationBlock;

    // The amount of block during which a price is considered valid
    uint256 public validPricePeriodInBlocks;

    // After emergencyPublishingPeriodInBlocks from last publication the emergency whitelisted oracles can publish
    uint256 public emergencyPublishingPeriodInBlocks;

    OracleManager public oracleManager;

    IERC20 public token;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor() internal {}

    // solhint-disable-previous-line no-empty-blocks

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;

    /**
      @notice Modifier that protects the function
      @dev You should use this modifier in any function that should be called only by oracle manager
     */
    modifier onlyOracleManager() {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        _;
    }
}
