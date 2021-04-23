// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";

contract OracleManagerStorage is Initializable, Governed, IIterableWhitelist {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;
    using IterableOraclesLib for IterableOraclesLib.IterableOraclesData;
    using IterableWhitelistLib for IterableWhitelistLib.IterableWhitelistData;

    // Whitelisted contracts that can operate oracles in this one.
    IterableWhitelistLib.IterableWhitelistData internal iterableWhitelistData;

    // Coin pair register
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Registered oracles
    IterableOraclesLib.IterableOraclesData internal registeredOracles;

    // Staking contract that manages stake
    Staking internal stakingContract;

    // Minimum coin pair subscription stake
    uint256 internal minCPSubscriptionStake;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;

    /**
    @notice Modifier that protects the function
    @dev You should use this modifier in any function that should be called through the governance system
    or a whitelisted  contract
     */
    modifier authorizedChangerOrWhitelisted() {
        require(
            iterableWhitelistData._isWhitelisted(msg.sender) ||
                governor.isAuthorizedChanger(msg.sender),
            "Address is not whitelisted"
        );
        _;
    }
}
