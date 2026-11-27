// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "@moc/periphery/contracts/moc-governance/Governance/IGovernor.sol";
import {IOracleManager} from "@moc/periphery/contracts/IOracleManager.sol";
import {IStakingMachine} from "@moc/periphery/contracts/IStakingMachine.sol";
import {Governed} from "@moc/periphery/contracts/moc-governance/Governance/Governed.sol";
import {IterableOraclesLib} from "./libs/IterableOraclesLib.sol";
import {Staking} from "./Staking.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {OracleManagerStorage} from "./OracleManagerStorage.sol";

contract OracleManager is OracleManagerStorage, IOracleManager {
    using SafeMath for uint256;

    uint256 public constant DEFAULT_MAX_ORACLES_PER_ROUND = 10;
    uint256 public constant DEFAULT_MAX_REGISTERED_ORACLES = 20;

    event OracleRegistered(address caller, address addr, string internetName);
    event OracleStakeAdded(address caller, address addr, uint256 stake);
    event OracleSubscribed(address caller, bytes32 coinpair);
    event OracleUnsubscribed(address caller, bytes32 coinpair);
    event OracleRemoved(address caller);
    event MaxOraclesPerRoundSet(uint256 maxOraclesPerRound);
    event MaxRegisteredOraclesSet(uint256 maxRegisteredOracles);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------

    constructor() public initializer {
        // Avoid leaving the implementation contract uninitialized.
    }

    /// @notice Construct this contract.
    /// @param _governor The address of the contract which governs this one
    /// @param _minCPSubscriptionStake The minimum amount of tokens required as stake for a coin pair subscription.
    /// @param _stakingContract the Staking contract address.
    /// @param _wlist whitelisted contract that can call this one (usually only staking).
    function initialize(
        IGovernor _governor,
        uint256 _minCPSubscriptionStake,
        Staking _stakingContract,
        address[] calldata _wlist
    ) external initializer {
        require(address(_stakingContract) != address(0), "Staking contract address must be != 0");
        require(
            _minCPSubscriptionStake > 0,
            "The minimum coin pair subscription stake amount cannot be zero"
        );

        Governed._initialize(_governor);
        stakingContract = _stakingContract;

        minCPSubscriptionStake = _minCPSubscriptionStake;
        maxOraclesPerRound = DEFAULT_MAX_ORACLES_PER_ROUND;
        maxRegisteredOracles = DEFAULT_MAX_REGISTERED_ORACLES;
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(
        bytes32 coinPair,
        address addr
    ) external override onlyAuthorizedChanger {
        coinPairRegisterData._registerCoinPair(coinPair, addr);
    }

    /// @notice Unregister an existing coin pair contract.
    /// @dev This function handles the full cleanup flow:
    ///      1. Force-closes the current round, distributing any accumulated rewards.
    ///      2. Unsubscribes all oracles from the coin pair.
    ///      3. Removes the coin pair from the registry.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function unregisterCoinPair(bytes32 coinPair, uint256 hint) external onlyAuthorizedChanger {
        CoinPairPrice cp = _getCoinPairAddress(coinPair);

        // 1. Distribute accumulated rewards and close the current round.
        //    forceCloseRound bypasses the lock period check so this can always be called.
        cp.forceCloseRound();

        // 2. Unsubscribe all oracles from this coin pair.
        //    Always read index 0 because each unsubscribe removes one element from the array.
        uint256 len = cp.getSubscribedOraclesLen();
        for (uint256 i = 0; i < len; i++) {
            address ownerAddr = cp.getSubscribedOracleAtIndex(0);
            cp.unsubscribe(ownerAddr);
        }

        // 3. Remove from the registry.
        coinPairRegisterData._unRegisterCoinPair(coinPair, hint);
    }

    /**
     @notice Add to the list of contracts that can stake in this contract

     @param  _whitelisted - the override coinPair
    */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     @notice Remove from the list of contracts that can stake in this contract

     @param _whitelisted - the override coinPair
    */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
    }

    /// @notice Clears the registered owner of an oracle address.
    /// @dev In Legacy version, when an oracle called setOracleAddress, the registered owner of the old oracle address was not cleared,
    /// allowing the same owner to have multiple registered oracles. This function allows to clear the registered owner to be called in a changer
    /// and remove the old oracle address from the system, allowing to have only one registered oracle per owner.
    /// @param oracleAddr Address of the Oracle to delete the registered owner for.
    function clearRegisteredOwner(address oracleAddr) external onlyAuthorizedChanger {
        registeredOracles._clearRegisteredOwner(oracleAddr);
    }

    /// @notice Registers an oracle in the system.
    /// @dev If the global registered limit (`getMaxRegisteredOracles()`) is reached, replaces the
    ///      lowest-stake removable registered oracle (not selected in any current round) provided the
    ///      new operator has strictly greater stake.
    /// @param ownerAddr Address of the Oracle's owner.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    function registerOracle(
        address ownerAddr,
        address oracleAddr,
        string calldata internetName
    ) external override onlyWhitelisted(iterableWhitelistData) {
        require(ownerAddr != address(0), "Owner address cannot be 0x0");
        require(oracleAddr != address(0), "Oracle address cannot be 0x0");
        require(!_isOwnerRegistered(ownerAddr), "Owner already registered");
        require(!registeredOracles._isOracleRegistered(oracleAddr), "Oracle already registered");

        if (registeredOracles._getLen() >= getMaxRegisteredOracles()) {
            uint256 ownerStake = getStake(ownerAddr);
            require(ownerStake > 0, "Not enough stake to register");
            (bool found, address minOwner, ) = _getMinRemovableRegisteredOracle(ownerStake);
            require(found, "Not enough stake to register");
            _unsubscribeAll(minOwner);
            registeredOracles._removeOracle(minOwner);
            emit OracleRemoved(minOwner);
        }

        registeredOracles._registerOracle(ownerAddr, oracleAddr, internetName);
        emit OracleRegistered(ownerAddr, oracleAddr, internetName);
    }

    /// @notice The oracle owner did a partial withdrawal of funds
    /// 1. Returns 0 immediately if the address is not a registered oracle owner.
    /// 2. Computes the global top-N registered oracles at most once (only if selected in any coinpair).
    /// 3. Each coin pair is consulted to update round membership / unsubscription and return lock time.
    /// The return value is the maximum timestamp from all the coin pairs.
    /// @param oracleOwnerAddr Address of oracle owner
    /// @return the timestamp until which the funds must be locked.
    function onWithdraw(
        address oracleOwnerAddr
    ) external override onlyWhitelisted(iterableWhitelistData) returns (uint256) {
        if (!_isOwnerRegistered(oracleOwnerAddr)) {
            return 0;
        }
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        uint256 timestamp = 0;
        uint256 maxTimestamp = 0;
        address[] memory topRegistered;
        bool topComputed = false;
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isOracleInCurrentRound(oracleOwnerAddr)) {
                if (!topComputed) {
                    topRegistered = getTopRegisteredOracles();
                    topComputed = true;
                }
                timestamp = cp.onWithdraw(oracleOwnerAddr, topRegistered);
            } else {
                timestamp = cp.onWithdraw(oracleOwnerAddr);
            }
            if (timestamp > maxTimestamp) {
                maxTimestamp = timestamp;
            }
        }
        return maxTimestamp;
    }

    /// @notice Used by the coin pair to get the oracle address from the oracleOwnerAddress.
    /// @param  oracleOwnerAddr the address of the owner of the oracle.
    /// @return oracleAddr Address of oracle
    function getOracleAddress(
        address oracleOwnerAddr
    ) public view override returns (address oracleAddr) {
        return registeredOracles._getOracleAddress(oracleOwnerAddr);
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function subscribeToCoinPair(
        address ownerAddr,
        bytes32 coinPair
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(ownerAddr);

        emit OracleSubscribed(ownerAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param ownerAddr Address of message sender
    /// @param coinPair Name of coin pair
    function unSubscribeFromCoinPair(
        address ownerAddr,
        bytes32 coinPair
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(ownerAddr);

        emit OracleUnsubscribed(ownerAddr, coinPair);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(
        address ownerAddr,
        bytes32 coinPair
    ) external view override returns (bool) {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        return ctAddr.isSubscribed(ownerAddr);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param ownerAddr Address of message sender
    /// @param name The new name to set.
    function setOracleName(
        address ownerAddr,
        string calldata name
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setName(ownerAddr, name);
    }

    /// @notice Change the oracle address
    /// @param ownerAddr Address of message sender
    /// @param oracleAddr The new oracle address
    function setOracleAddress(
        address ownerAddr,
        address oracleAddr
    ) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");
        registeredOracles._setOracleAddress(ownerAddr, oracleAddr);
    }

    /// @notice Return true if the oracle is registered in the contract
    /// @param ownerAddr The address of the owner of the Oracle to check for.
    function isOracleRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param ownerAddr address of the oracle owner to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(
        address ownerAddr,
        bytes32 coinpair
    ) external view override returns (uint256 points, bool selectedInCurrentRound) {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinpair);
        (points, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(ownerAddr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param ownerAddr Address of message sender
    function removeOracle(address ownerAddr) external override authorizedChangerOrWhitelisted {
        require(_isOwnerRegistered(ownerAddr), "Oracle not registered");

        _unsubscribeAll(ownerAddr);
        require(_canRemoveOracle(ownerAddr), "Not ready to remove");
        registeredOracles._removeOracle(ownerAddr);
        emit OracleRemoved(ownerAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function canRemoveOracle(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr) && _canRemoveOracle(ownerAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param ownerAddr The address of the oracle's owner.
    function getStake(address ownerAddr) public view override returns (uint256 balance) {
        return stakingContract.getBalance(ownerAddr);
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param ownerAddr The address of the oracle's owner.
    function getOracleRegistrationInfo(
        address ownerAddr
    )
        external
        view
        override
        returns (string memory internetName, uint256 stake, address oracleAddr)
    {
        (oracleAddr, internetName) = registeredOracles._getOracleInfo(ownerAddr);
        stake = getStake(ownerAddr);
    }

    /// @notice Returns true if oracle is registered.
    /// @param ownerAddr The address of the oracle's owner.
    function isRegistered(address ownerAddr) external view override returns (bool) {
        return _isOwnerRegistered(ownerAddr);
    }

    /// @notice Used by CoinPair
    /// @param oracleAddr The oracle address not the owner address.
    function getOracleOwner(address oracleAddr) external view override returns (address) {
        return registeredOracles._getOwner(oracleAddr);
    }

    /// @notice Returns the amount of owners registered.
    function getRegisteredOraclesLen() external view override returns (uint256) {
        return registeredOracles._getLen();
    }

    /// @notice Returns the oracle name and address at index.
    /// @param idx index to query.
    function getRegisteredOracleAtIndex(
        uint256 idx
    ) external view override returns (address ownerAddr, address oracleAddr, string memory url) {
        return registeredOracles._getOracleAtIndex(idx);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view override returns (uint256) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view override returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view override returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    function getMaxStake(
        address[] calldata addresses
    ) external view override returns (address, uint256) {
        return stakingContract.getMaxBalance(addresses);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(
        bytes32 coinPair,
        uint256 hint
    ) external view override returns (uint256) {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }

    // Public variable
    function getStakingContract() external view override returns (IStakingMachine) {
        return stakingContract;
    }

    // Public variable
    function getMinCPSubscriptionStake() external view override returns (uint256) {
        return minCPSubscriptionStake;
    }

    /// @notice Updates the maximum number of top registered oracles eligible per round.
    /// @dev Only governance authorized changers can update this value.
    /// @param _maxOraclesPerRound New maximum count of top registered oracles (must be > 0 and <= maxRegisteredOracles).
    function setMaxOraclesPerRound(
        uint256 _maxOraclesPerRound
    ) external onlyAuthorizedChanger {
        require(_maxOraclesPerRound > 0, "The maximum oracles per round must be >0");
        require(
            _maxOraclesPerRound <= getMaxRegisteredOracles(),
            "Max oracles per round must be <= max registered oracles"
        );
        maxOraclesPerRound = _maxOraclesPerRound;
        emit MaxOraclesPerRoundSet(_maxOraclesPerRound);
    }

    /// @notice Returns the maximum number of top registered oracles eligible per round.
    /// @dev Falls back to DEFAULT_MAX_ORACLES_PER_ROUND (10) if unset (e.g., on upgraded proxies).
    function getMaxOraclesPerRound() public view returns (uint256) {
        return maxOraclesPerRound == 0 ? DEFAULT_MAX_ORACLES_PER_ROUND : maxOraclesPerRound;
    }

    /// @notice Updates the global maximum number of registered oracles allowed in the system.
    /// @dev Only governance authorized changers can update this value.
    /// @param _maxRegisteredOracles New global maximum count of registered oracles (must be >= maxOraclesPerRound).
    function setMaxRegisteredOracles(
        uint256 _maxRegisteredOracles
    ) external onlyAuthorizedChanger {
        require(
            _maxRegisteredOracles >= getMaxOraclesPerRound(),
            "Max registered oracles must be >= max oracles per round"
        );
        maxRegisteredOracles = _maxRegisteredOracles;
        emit MaxRegisteredOraclesSet(_maxRegisteredOracles);
    }

    /// @notice Returns the global maximum number of registered oracles allowed in the system.
    /// @dev Falls back to DEFAULT_MAX_REGISTERED_ORACLES (20) if unset (e.g., on upgraded proxies).
    function getMaxRegisteredOracles() public view returns (uint256) {
        return
            maxRegisteredOracles == 0 ? DEFAULT_MAX_REGISTERED_ORACLES : maxRegisteredOracles;
    }

    /// @notice Returns the top registered oracle owners with stake >= minCPSubscriptionStake,
    ///         ordered by descending stake, up to getMaxOraclesPerRound().
    /// @dev Tie-breaking rule: when two registered operators have equal stake, the one with the lower
    ///      `ownerAddr` value takes precedence. This is deterministic and independent of registration/removal order.
    ///      Ranking changes from stake deposits or oracle removals take effect on the next `switchRound()`
    ///      (or on `subscribe()` if a top-ranked operator subscribes while the round has an empty slot).
    function getTopRegisteredOracles() public view returns (address[] memory selected) {
        uint256 total = registeredOracles._getLen();
        uint256 count = getMaxOraclesPerRound();
        if (count > total) {
            count = total;
        }
        if (count == 0) {
            return new address[](0);
        }

        uint256 minStake = minCPSubscriptionStake;
        address[] memory top = new address[](count);
        uint256[] memory topStakes = new uint256[](count);
        uint256 filled = 0;

        for (uint256 i = 0; i < total; i++) {
            address candidate = registeredOracles._getOwnerAtIndex(i);
            uint256 candidateStake = getStake(candidate);
            if (candidateStake < minStake) {
                continue;
            }

            uint256 j = filled;
            if (j == count) {
                j = count - 1;
                if (!_ranksAhead(candidate, candidateStake, top[j], topStakes[j])) {
                    continue;
                }
            } else {
                filled += 1;
            }

            while (
                j > 0 && _ranksAhead(candidate, candidateStake, top[j - 1], topStakes[j - 1])
            ) {
                top[j] = top[j - 1];
                topStakes[j] = topStakes[j - 1];
                j--;
            }
            top[j] = candidate;
            topStakes[j] = candidateStake;
        }

        if (filled == count) {
            return top;
        }
        selected = new address[](filled);
        for (uint256 i = 0; i < filled; i++) {
            selected[i] = top[i];
        }
        return selected;
    }

    /// @notice Returns true if `ownerAddr` is registered, meets `minCPSubscriptionStake`,
    ///         and ranks within the top `getMaxOraclesPerRound()` registered operators by stake.
    function isTopRegisteredOracle(address ownerAddr) public view returns (bool) {
        if (!_isOwnerRegistered(ownerAddr) || getStake(ownerAddr) < minCPSubscriptionStake) {
            return false;
        }
        if (registeredOracles._getLen() <= getMaxOraclesPerRound()) {
            return true;
        }
        address[] memory top = getTopRegisteredOracles();
        for (uint256 i = 0; i < top.length; i++) {
            if (top[i] == ownerAddr) {
                return true;
            }
        }
        return false;
    }

    function _ranksAhead(
        address candidate,
        uint256 candidateStake,
        address existing,
        uint256 existingStake
    ) private pure returns (bool) {
        return
            candidateStake > existingStake ||
            (candidateStake == existingStake && candidate < existing);
    }

    /// @dev Finds the lowest-stake registered oracle owner with stake strictly below `maxStakeExclusive`
    ///      that is not currently in any active round.
    ///      On equal stake, picks the higher owner address (consistent with lower address winning ties).
    function _getMinRemovableRegisteredOracle(
        uint256 maxStakeExclusive
    ) private view returns (bool found, address minOwner, uint256 minStake) {
        uint256 total = registeredOracles._getLen();
        for (uint256 i = 0; i < total; i++) {
            address candidate = registeredOracles._getOwnerAtIndex(i);
            uint256 candidateStake = getStake(candidate);
            if (candidateStake >= maxStakeExclusive) {
                continue;
            }
            if (found && _ranksAhead(candidate, candidateStake, minOwner, minStake)) {
                continue;
            }
            if (!_canRemoveOracle(candidate)) {
                continue;
            }
            found = true;
            minOwner = candidate;
            minStake = candidateStake;
        }
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param ownerAddr the address of the owner of the oracle to lookup.
    function _canRemoveOracle(address ownerAddr) private view returns (bool) {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            if (cp.isOracleInCurrentRound(ownerAddr)) {
                return false;
            }
        }
        return true;
    }

    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param ownerAddr Address of the oracle owner.
    function _unsubscribeAll(address ownerAddr) private {
        uint256 coinPairCount = coinPairRegisterData._getCoinPairCount();
        for (uint256 i = 0; i < coinPairCount; i++) {
            bytes32 coinPair = coinPairRegisterData._getCoinPairAtIndex(i);
            CoinPairPrice cp = _getCoinPairAddress(coinPair);
            if (cp.isSubscribed(ownerAddr)) {
                cp.unsubscribe(ownerAddr);
                emit OracleUnsubscribed(ownerAddr, coinPair);
            }
        }
    }

    // A change contract can act as the owner of an Oracle
    /// @param oracleOwner Message sender's address
    function _isOwnerRegistered(address oracleOwner) private view returns (bool) {
        return registeredOracles._isOwnerRegistered(oracleOwner);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }
}
