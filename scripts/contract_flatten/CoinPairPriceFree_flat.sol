/*
Copyright MOC Investments Corp. 2020. All rights reserved.

You acknowledge and agree that MOC Investments Corp. (“MOC”) (or MOC’s licensors) own all legal right, title and
interest in and to the work, software, application, source code, documentation and any other documents in this
repository (collectively, the “Program”), including any intellectual property rights which subsist in the
Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist),
whether in source code or any other form.

Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy,
modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise
attempt to extract the source code of, the Program or any part thereof, except that you may contribute to
this repository.

You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify,
merge, combine with another program or create derivative works of the Program (such resulting program, collectively,
the “Resulting Program”) solely for Non-Commercial Use as long as you:

 1. give prominent notice (“Notice”) with each copy of the Resulting Program that the Program is used in the Resulting
  Program and that the Program is the copyright of MOC Investments Corp.; and
 2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith,
  combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial
  Use restriction set forth herein.

“Non-Commercial Use” means each use as described in clauses (1)-(3) below, as reasonably determined by MOC Investments
Corp. in its sole discretion:

 1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each
 case without any anticipated commercial application;
 2. use by any charitable organization, educational institution, public research organization, public safety or health
 organization, environmental protection organization or government institution; or
 3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally
 do not exceed 100 at any time.

You will not use any trade mark, service mark, trade name, logo of MOC Investments Corp. or any other company or
organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks,
names or logos.

If you have any questions, comments or interest in pursuing any other use cases, please reach out to us
at moc.license@moneyonchain.com.

*/

pragma solidity 0.6.12;

/**
 * @dev Interface of the old MOC Oracle
 */
interface IPriceProvider {
    // Legacy function compatible with old MOC Oracle.
    // returns a tuple (uint256, bool) that corresponds
    // to the price and if it is not expired.
    function peek() external view returns (bytes32, bool);

    // Return the current price.
    function getPrice() external view returns (uint256);

    // Return if the price is not expired.
    function getIsValid() external view returns (bool);

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external view returns (uint256);

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        view
        returns (uint256 price, bool isValid, uint256 lastPubBlock);
}

/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     */
    bool private initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private initializing;

    /**
     * @dev Modifier to use in the initializer function of a contract.
     */
    modifier initializer() {
        require(
            initializing || isConstructor() || !initialized,
            "Contract instance has already been initialized"
        );

        bool isTopLevelCall = !initializing;
        if (isTopLevelCall) {
            initializing = true;
            initialized = true;
        }

        _;

        if (isTopLevelCall) {
            initializing = false;
        }
    }

    /// @dev Returns true if and only if the function is running in the constructor
    function isConstructor() private view returns (bool) {
        // extcodesize checks the size of the code stored in an address, and
        // address returns the current address. Since the code is still not
        // deployed when running a constructor, any checks on its code size will
        // yield zero, making it an effective way to detect if a contract is
        // under construction or not.
        address self = address(this);
        uint256 cs;
        assembly {
            cs := extcodesize(self)
        }
        return cs == 0;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}

/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPriceFree is Initializable, IPriceProvider {
    IPriceProvider public coinPairPrice;

    function initialize(IPriceProvider _coinPairPrice) public initializer {
        coinPairPrice = _coinPairPrice;
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek() external view override returns (bytes32, bool) {
        return coinPairPrice.peek();
    }

    // Return the current price.
    function getPrice() external view override returns (uint256) {
        (bytes32 price, ) = coinPairPrice.peek();
        return uint256(price);
    }

    // Return if the price is not expired.
    function getIsValid() external view override returns (bool) {
        (, bool valid) = coinPairPrice.peek();
        return valid;
    }

    // Returns the block number of the last publication.
    function getLastPublicationBlock() external view override returns (uint256) {
        return coinPairPrice.getLastPublicationBlock();
    }

    // Return the result of getPrice, getIsValid and getLastPublicationBlock at once.
    function getPriceInfo()
        external
        view
        override
        returns (uint256 price, bool isValid, uint256 lastPubBlock)
    {
        // This is compatible with the old implementation of a coinPairPrice
        lastPubBlock = coinPairPrice.getLastPublicationBlock();
        bytes32 price32;
        (price32, isValid) = coinPairPrice.peek();
        return (uint256(price32), isValid, lastPubBlock);
    }
}
