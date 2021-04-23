// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import {Governed} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@money-on-chain/omoc-sc-shared/contracts/moc-governance/Governance/IGovernor.sol";
import {IPriceProviderRegisterEntry} from "@money-on-chain/omoc-sc-shared/contracts/IPriceProviderRegisterEntry.sol";
import {CoinPairRegisterLib} from "./libs/CoinPairRegisterLib.sol";

/// @title A registry for the coin pair prices, this is more general than OracleManager that stores
/// only the coin pairs that are published by oracles.
contract PriceProviderRegisterStorage is Initializable, Governed {
    using SafeMath for uint256;
    using CoinPairRegisterLib for CoinPairRegisterLib.CoinPairRegisterData;

    // Coin Pair register, has the same entries as OracleManage + calculated prices.
    CoinPairRegisterLib.CoinPairRegisterData internal coinPairRegisterData;

    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    // solhint-disable-next-line no-empty-blocks
    constructor() internal {}

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
