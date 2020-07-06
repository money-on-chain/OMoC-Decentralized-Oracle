pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOraclesLib.sol";
import {OracleInfoLib} from "./libs/OracleInfoLib.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import {CoinPairPrice} from "./CoinPairPrice.sol";
import {OracleManagerStorage} from "./OracleManagerStorage.sol";

contract OracleManager is OracleManagerStorage {
    using SafeMath for uint;

    event OracleRegistered(address caller, address addr, string internetName, uint stake);
    event OracleStakeAdded(address caller, address addr, uint stake);
    event OracleSubscribed(address caller, address addr, bytes32 coinpair);
    event OracleUnsubscribed(address caller, address addr, bytes32 coinpair);
    event OracleRemoved(address caller, address addr);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------

    /// @notice Construct this contract.
    /// @param _minOracleOwnerStake The minimum amount of tokens required as stake by oracle owners.
    /// @param _supportersContract the Supporters contract contract address.
    function initialize(IGovernor _governor, uint256 _minOracleOwnerStake, SupportersWhitelisted _supportersContract)
    external initializer {
        require(address(_supportersContract) != address(0), "Supporters contract address must be != 0");
        require(address(_supportersContract.mocToken()) != address(0), "Token contract address must be != 0");
        require(_minOracleOwnerStake > 0, "The minimum oracle owner stake amount cannot be zero");

        Governed._initialize(_governor);
        supportersContract = _supportersContract;
        token = _supportersContract.mocToken();

        minOracleOwnerStake = _minOracleOwnerStake;
        registeredOracles = RegisteredOraclesLib.initRegisteredOracles(getStake);
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(bytes32 coinPair, address addr) external onlyAuthorizedChanger() {
        coinPairRegisterData._registerCoinPair(coinPair, addr);
    }

    /// Register an oracle in the system with an initial stake.
    /// @notice Registers the oracle and transfer the specified caller's MOC token stake.
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    /// @param stake The amount that the oracle owner (the caller) will put at stake. This will be transferred
    ///                 immediately if conditions apply.
    function registerOracle(address oracleAddr, string calldata internetName, uint stake) external {
        registerOracleWithHint(oracleAddr, internetName, stake, address(0));
    }

    /// @notice Registers the oracle and transfer the specified caller's MOC token stake. Using a hint to sort it
    /// @param oracleAddr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    /// @param stake The amount that the oracle owner (the caller) will put at stake. This will be transferred immediately
    ///              if conditions apply.
    /// @param prevEntry Place in the single-linked-list in which this oracle must be inserted
    function registerOracleWithHint(address oracleAddr, string memory internetName, uint stake, address prevEntry)
    public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(!data.isRegistered(), "Oracle already registered");
        require(oracleAddr != address(0), "Address cannot be zero");
        require(stake >= minOracleOwnerStake, "Stake not at least the minimum required amount");

        _addStake(msg.sender, oracleAddr, stake);
        registeredOracles.add(oracleAddr, internetName, prevEntry);
        emit OracleRegistered(msg.sender, oracleAddr, internetName, stake);
    }

    /// @notice Add stake from owner account
    /// @param oracleAddr Address of oracle
    /// @param stake Stake to transfer from owner account
    function addStake(address oracleAddr, uint stake) external {
        addStakeWithHint(oracleAddr, stake, address(0), address(0));
    }

    /// @notice Add stake from owner account using a hint to locate it
    /// @param oracleAddr Address of oracle
    /// @param stake Stake to transfer from owner account
    /// @param removePrevEntry Place in the single-linked-list from which this oracle must be removed
    /// @param addPrevEntry Place in the single-linked-list in which this oracle must be inserted after stake change
    function addStakeWithHint(address oracleAddr, uint stake, address removePrevEntry, address addPrevEntry) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        // Transfer stake [should be approved by oracle owner first]
        _addStake(msg.sender, oracleAddr, stake);
        registeredOracles.modify(oracleAddr, removePrevEntry, addPrevEntry);
        emit OracleStakeAdded(msg.sender, oracleAddr, stake);
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param oracleAddr Address of oracle
    function subscribeCoinPair(address oracleAddr, bytes32 coinPair) external {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.subscribe(oracleAddr);

        emit OracleSubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param oracleAddr Address of oracle
    function unsubscribeCoinPair(address oracleAddr, bytes32 coinPair) external {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        ctAddr.unsubscribe(oracleAddr);

        emit OracleUnsubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice stop the supporters part of oracle stake
    /// @param oracleAddr Address of oracle
    function stop(address oracleAddr) external {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");
        _unsubscribeAll(oracleAddr);
        supportersContract.stop(oracleAddr);
    }

    /// @notice Returns true if an oracle is subscribed to a coin pair
    function isSubscribed(address oracleAddr, bytes32 coinPair) public view returns (bool) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");

        CoinPairPrice ctAddr = _getCoinPairAddress(coinPair);
        return ctAddr.isSubscribed(oracleAddr);
    }

    /// @notice Returns the list of subscribed coinpair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr)
    public view returns (CoinPairPrice[] memory addresses, uint count) {
        uint coinPairCount = coinPairRegisterData._getCoinPairCount();
        CoinPairPrice[] memory subscribedCoinpairs = new CoinPairPrice[](coinPairCount);
        uint256 valid = 0;
        for (uint256 i = 0; i < coinPairCount; i++)
        {
            bytes32 cp = coinPairRegisterData._getCoinPairAtIndex(i);
            if (isSubscribed(oracleAddr, cp))
            {
                subscribedCoinpairs[i] = _getCoinPairAddress(cp);
                valid = valid.add(1);
            }
        }

        return (subscribedCoinpairs, valid);
    }

    /// @notice Returns the registered Oracle list head to start iteration.
    function getRegisteredOracleHead() external view returns (address) {
        return registeredOracles.getHead();
    }

    /// @notice Returns the registered Oracle list next entry.
    /// @param oracleAddr The address of previous oracle.
    function getRegisteredOracleNext(address oracleAddr) external view returns (address) {
        return registeredOracles.getNext(oracleAddr);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param oracleAddr The address to search for.
    function getPrevByAddr(address oracleAddr) external view returns (address) {
        return registeredOracles.getPrevByAddr(address(0), oracleAddr);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param oracleAddr The address to search for.
    function getPrevByAddrWithHint(address oracleAddr, address prevEntry) external view returns (address) {
        return registeredOracles.getPrevByAddr(prevEntry, oracleAddr);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param stake The stake to search for.
    function getPrevByStake(uint stake) external view returns (address) {
        return registeredOracles.getPrevByStake(address(0), stake);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param stake The stake to search for.
    function getPrevByStakeWithHint(uint stake, address prevEntry) external view returns (address) {
        return registeredOracles.getPrevByStake(prevEntry, stake);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param oracleAddr Address of the oracle to change
    /// @param name The new name to set.
    function setOracleName(address oracleAddr, string calldata name) external {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle not registered");
        require(_isOwner(data), "This can be called by oracle owner only");
        data.setName(name);
    }

    /// @notice Return true if the oracle is registered on this coin-pair
    /// @param oracleAddr addr The address of the Oracle check for.
    function isOracleRegistered(address oracleAddr) external view returns (bool) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        return data.isRegistered();
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param oracleAddr addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(address oracleAddr)
    external view returns (string memory internetName, uint stake, address _owner) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle not registered");

        internetName = data.getName();
        stake = getStake(oracleAddr);
        _owner = data.getOwner();
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param oracleAddr address of the oracle to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(address oracleAddr, bytes32 coinpair)
    external view returns (uint points, uint selectedInRound, bool selectedInCurrentRound) {
        CoinPairPrice ctAddr = _getCoinPairAddress(coinpair);
        (points, selectedInRound, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(oracleAddr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param oracleAddr The address of the oracle to remove from system.
    function removeOracle(address oracleAddr) external {
        removeOracleWithHint(oracleAddr, address(0));
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param oracleAddr The address of the oracle to remove from system.
    /// @param prevEntry Place in the single-linked-list from which this oracle must be removed
    function removeOracleWithHint(address oracleAddr, address prevEntry) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle not registered");
        require(_isOwner(data), "This can be called by oracle owner only");

        require(_canRemoveOracle(oracleAddr), "Oracle cannot be removed at this time");

        _unsubscribeAll(oracleAddr);
        uint256 tokens = supportersContract.getBalanceAt(address(this), oracleAddr);
        supportersContract.withdrawFromTo(tokens, oracleAddr, data.getOwner());
        registeredOracles.remove(oracleAddr, prevEntry);
        emit OracleRemoved(msg.sender, oracleAddr);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) external view returns (bool) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        return data.isRegistered() && _canRemoveOracle(oracleAddr) && supportersContract.canWithdraw(oracleAddr);
    }


    /// @notice Get the stake in MOCs that an oracle has.
    /// @param oracleAddr The address of the oracle.
    function getStake(address oracleAddr) public view returns (uint256 balance) {
        return supportersContract.getMOCBalanceAt(address(this), oracleAddr);
    }

    /// @notice Vesting information for account.
    /// @param oracleAddr The address of the oracle.
    function vestingInfoOf(address oracleAddr)
    external view returns (uint256 balance, uint256 stoppedInblock) {
        return supportersContract.vestingInfoOf(address(this), oracleAddr);
    }

    /// @notice Returns the count of registered coin pairs.
    /// Keep in mind that Deleted coin-pairs will contain zeroed addresses.
    function getCoinPairCount() external view returns (uint) {
        return coinPairRegisterData._getCoinPairCount();
    }

    /// @notice Returns the coin pair at index.
    /// @param i index to query.
    function getCoinPairAtIndex(uint256 i) external view returns (bytes32) {
        return coinPairRegisterData._getCoinPairAtIndex(i);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function getContractAddress(bytes32 coinpair) external view returns (address) {
        return coinPairRegisterData._getContractAddress(coinpair);
    }

    /// @notice Searches a coinpair in coinPairList
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param hint Optional hint to start traversing the coinPairList array, zero is to search all the array.
    function getCoinPairIndex(bytes32 coinPair, uint256 hint) external view returns (uint256) {
        return coinPairRegisterData._getCoinPairIndex(coinPair, hint);
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function _canRemoveOracle(address oracleAddr) private view returns (bool) {
        uint coinPairCount = coinPairRegisterData._getCoinPairCount();
        bool canRemove = true;
        for (uint i = 0; i < coinPairCount && canRemove; i++) {
            CoinPairPrice cp = _getCoinPairAddress(coinPairRegisterData._getCoinPairAtIndex(i));
            canRemove = canRemove && cp.canRemoveOracle(oracleAddr);
        }
        return canRemove;
    }

    /// @dev Add stake internal
    function _addStake(address oracleOwner, address oracleAddr, uint256 stake) private {
        // Transfer stake [should be approved by oracle owner first]
        require(token.transferFrom(oracleOwner, address(this), stake), "Error in transfer");

        // Stake at supportersContract contract
        require(token.approve(address(supportersContract), stake), "Error in approve");
        supportersContract.stakeAtFrom(stake, oracleAddr, address(this));
    }


    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param oracleAddr Address of oracle
    function _unsubscribeAll(address oracleAddr) private
    {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        (CoinPairPrice[] memory coinpairs, uint count) = getSubscribedCoinPairAddresses(oracleAddr);
        for (uint i = 0; i < count; i++) {
            coinpairs[i].unsubscribe(oracleAddr);
        }
    }

    // A change contract can act as the owner of an Oracle
    function _isOwner(OracleInfoLib.OracleRegisterInfo storage data) private view returns (bool) {
        return data.isOwner(msg.sender) || governor.isAuthorizedChanger(msg.sender);
    }

    /// @notice Return the contract address for a specified registered coin pair.
    /// @param coinpair Coin-pair string to lookup (e.g: BTCUSD)
    /// @return address Address of contract or zero if does not exist or was deleted.
    function _getCoinPairAddress(bytes32 coinpair) private view returns (CoinPairPrice) {
        return CoinPairPrice(coinPairRegisterData._getContractAddress(coinpair));
    }

}
