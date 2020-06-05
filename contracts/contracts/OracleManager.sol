pragma solidity ^0.6.0;

import "./CoinPairRegister.sol";
import "./CoinPairPrice.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {RegisteredOraclesLib} from "./libs/RegisteredOracles.sol";
import {OracleInfoLib} from "./libs/OracleInfo.sol";
import {SupportersWhitelisted} from "./SupportersWhitelisted.sol";
import "./openzeppelin/Initializable.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./moc-gobernanza/Governance/Governed.sol";

contract OracleManager is CoinPairRegister, Initializable, Governed {
    RegisteredOraclesLib.RegisteredOracles  registeredOracles;
    SupportersWhitelisted public            supportersContract;
    uint256 public                          minOracleOwnerStake;
    IERC20 public                           token;

    using SafeMath for uint;
    using RegisteredOraclesLib for RegisteredOraclesLib.RegisteredOracles;
    using OracleInfoLib for OracleInfoLib.OracleRegisterInfo;
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
    function initialize(IGovernor _governor, uint256 _minOracleOwnerStake, SupportersWhitelisted _supportersContract) public initializer
    {
        require(address(_supportersContract) != address(0), "Supporters contract address must be != 0");
        require(address(_supportersContract.mocToken()) != address(0), "Token contract address must be != 0");
        require(_minOracleOwnerStake > 0, "The minimum oracle owner stake amount cannot be zero");

        Governed.initialize(_governor);
        supportersContract = _supportersContract;
        token = _supportersContract.mocToken();

        minOracleOwnerStake = _minOracleOwnerStake;
        registeredOracles = RegisteredOraclesLib.init(getStake);
    }

    /**
     * @dev Sets the minOracleOwnerStake by gobernanza
     * @param _minOracleOwnerStake - the override minOracleOwnerStake
     */
    function setMinOracleOwnerStake(uint _minOracleOwnerStake) public onlyAuthorizedChanger() {
        minOracleOwnerStake = _minOracleOwnerStake;
    }

    /// @notice Register a new coin pair contract.
    /// @param coinPair The bytes32-encoded coinpair string (e.g. BTCUSD)
    /// @param addr The contract address associated to the coinpair.
    function registerCoinPair(bytes32 coinPair, address addr) public onlyAuthorizedChanger()
    {
        super._registerCoinPair(coinPair, addr);
    }

    /// Register an oracle in the system with an initial stake.
    /// @notice Registers the oracle and transfer the specified caller's MOC token stake.
    /// @param addr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    /// @param stake The amount that the oracle owner (the caller) will put at stake. This will be transferred immediately
    ///              if conditions apply.
    function registerOracle(address addr, string memory internetName, uint stake) public {
        registerOracleWithHint(addr, internetName, stake, address(0));
    }

    /// @notice Registers the oracle and transfer the specified caller's MOC token stake. Using a hint to sort it
    /// @param addr Address of the Oracle to register.
    /// @param internetName Public Internet name of this Oracle.
    /// @param stake The amount that the oracle owner (the caller) will put at stake. This will be transferred immediately
    ///              if conditions apply.
    /// @param prevEntry Place in the single-linked-list in which this oracle must be inserted
    function registerOracleWithHint(address addr, string memory internetName, uint stake, address prevEntry) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(addr);
        require(!data.isRegistered(), "Oracle already registered");
        require(addr != address(0), "Address cannot be zero");
        require(stake >= minOracleOwnerStake, "Stake not at least the minimum required amount");

        _addStake(msg.sender, addr, stake);
        registeredOracles.add(addr, internetName, prevEntry);
        emit OracleRegistered(msg.sender, addr, internetName, stake);
    }

    /// @notice Add stake from owner account
    /// @param addr Address of oracle
    /// @param stake Stake to transfer from owner account
    function addStake(address addr, uint stake) public {
        addStakeWithHint(addr, stake, address(0), address(0));
    }

    /// @notice Add stake from owner account using a hint to locate it
    /// @param addr Address of oracle
    /// @param stake Stake to transfer from owner account
    /// @param removePrevEntry Place in the single-linked-list from which this oracle must be removed
    /// @param addPrevEntry Place in the single-linked-list in which this oracle must be inserted after stake change
    function addStakeWithHint(address addr, uint stake, address removePrevEntry, address addPrevEntry) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(addr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        // Transfer stake [should be approved by oracle owner first]
        _addStake(msg.sender, addr, stake);
        registeredOracles.modify(addr, removePrevEntry, addPrevEntry);
        emit OracleStakeAdded(msg.sender, addr, stake);
    }

    /// @notice Subscribe a registered oracle to participate in rounds of a registered coin-pair
    /// @param oracleAddr Address of oracle
    function subscribeCoinPair(address oracleAddr, bytes32 coinPair) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        CoinPairPrice ctAddr = (CoinPairPrice) (super.getContractAddress(coinPair));
        ctAddr.subscribe(oracleAddr);

        emit OracleSubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice Unsubscribe a registered oracle from participating in rounds of a registered coin-pair
    /// @param oracleAddr Address of oracle
    function unsubscribeCoinPair(address oracleAddr, bytes32 coinPair) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        CoinPairPrice ctAddr = (CoinPairPrice) (super.getContractAddress(coinPair));
        ctAddr.unsubscribe(oracleAddr);

        emit OracleUnsubscribed(msg.sender, oracleAddr, coinPair);
    }

    /// @notice stop the supporters part of oracle stake
    /// @param oracleAddr Address of oracle
    function stop(address oracleAddr) public {
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

        CoinPairPrice ctAddr = (CoinPairPrice) (super.getContractAddress(coinPair));
        return ctAddr.isSubscribed(oracleAddr);
    }

    /// @notice Returns the list of subscribed coinpair contract address for an oracle
    /// @return addresses Array of subscribed coin pairs addresses.
    /// @return count The count of valid entries in the addresses param.
    function getSubscribedCoinPairAddresses(address oracleAddr) public view returns (address[] memory addresses, uint count) {
        uint coinPairCount = super.getCoinPairCount();
        address[] memory subscribedCoinpairs = new address[](coinPairCount);
        uint256 valid = 0;
        for (uint256 i = 0; i < coinPairCount; i++)
        {
            bytes32 cp = super.getCoinPairAtIndex(i);
            if (isSubscribed(oracleAddr, cp))
            {
                subscribedCoinpairs[i] = (super.getContractAddress(cp));
                valid = valid.add(1);
            }
        }

        return (subscribedCoinpairs, valid);
    }

    /// @notice Returns the registered Oracle list head to start iteration.
    function getRegisteredOracleHead() public view returns (address)
    {
        return registeredOracles.getHead();
    }

    /// @notice Returns the registered Oracle list next entry.
    /// @param iterator The address of previous oracle.
    function getRegisteredOracleNext(address iterator) public view returns (address)
    {
        return registeredOracles.getNext(iterator);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param addr The address to search for.
    function getPrevByAddr(address addr) public view returns (address) {
        return registeredOracles.getPrevByAddr(address(0), addr);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param addr The address to search for.
    function getPrevByAddrWithHint(address addr, address prevEntry) public view returns (address) {
        return registeredOracles.getPrevByAddr(prevEntry, addr);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param stake The stake to search for.
    function getPrevByStake(uint stake) public view returns (address) {
        return registeredOracles.getPrevByStake(address(0), stake);
    }

    /// @notice Search the Oracle list for the previous address of an entry.
    /// @param stake The stake to search for.
    function getPrevByStakeWithHint(uint stake, address prevEntry) public view returns (address) {
        return registeredOracles.getPrevByStake(prevEntry, stake);
    }

    /// @notice Change the oracle "internet" name (URI)
    /// @param addr Address of the oracle to change
    /// @param name The new name to set.
    function setOracleName(address addr, string memory name) public {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(addr);
        require(data.isRegistered(), "Oracle not registered");
        require(_isOwner(data), "This can be called by oracle owner only");
        data.setName(name);
    }

    /// @notice Return true if the oracle is registered on this coin-pair
    function isOracleRegistered(address addr) public view returns (bool) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(addr);
        return data.isRegistered();
    }

    /// @notice Returns registration information for a registered Oracle.
    /// @param addr The address of the Oracle to query for.
    function getOracleRegistrationInfo(address addr) public view returns (string memory internetName, uint stake,
        address _owner) {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(addr);
        require(data.isRegistered(), "Oracle not registered");

        internetName = data.getName();
        stake = getStake(addr);
        _owner = data.getOwner();
    }

    /// @notice Returns round information for a registered oracle in a specific coin-pair.
    /// @param addr The address of the oracle to query for.
    /// @param coinpair The coin pair to lookup.
    function getOracleRoundInfo(address addr, bytes32 coinpair) public view returns (uint points, uint selectedInRound,
        bool selectedInCurrentRound) {
        CoinPairPrice ctAddr = (CoinPairPrice) (super.getContractAddress(coinpair));
        (points, selectedInRound, selectedInCurrentRound) = ctAddr.getOracleRoundInfo(addr);
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param oracleAddr The address of the oracle to remove from system.
    function removeOracle(address oracleAddr) public
    {
        removeOracleWithHint(oracleAddr, address(0));
    }

    /// @notice Removes an oracle from the system if conditions in
    ///         contract he is participating apply, returning it's stake.
    /// @param oracleAddr The address of the oracle to remove from system.
    /// @param prevEntry Place in the single-linked-list from which this oracle must be removed
    function removeOracleWithHint(address oracleAddr, address prevEntry) public
    {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle not registered");
        require(_isOwner(data), "This can be called by oracle owner only");
        //(address[] memory subscribedTo, uint count) = getSubscribedCoinPairAddresses(oracleAddr);

        uint coinPairCount = super.getCoinPairCount();

        bool canRemove = true;
        for (uint i = 0; i < coinPairCount && canRemove; i++) {
            CoinPairPrice cp = (CoinPairPrice) (super.getContractAddress(super.getCoinPairAtIndex(i)));
            canRemove = canRemove && cp.canRemoveOracle(oracleAddr);
        }

        require(canRemove, "Oracle cannot be removed at this time");

        _unsubscribeAll(oracleAddr);
        uint256 tokens = supportersContract.getBalanceAt(address(this), oracleAddr);
        supportersContract.withdrawFromTo(tokens, oracleAddr, data.getOwner());
        registeredOracles.remove(oracleAddr, prevEntry);
        emit OracleRemoved(msg.sender, oracleAddr);
    }

    /// @notice Get the stake in MOCs that an oracle has.
    /// @param addr The address of the oracle.
    function getStake(address addr) public view returns (uint256 balance) {
        return supportersContract.getMOCBalanceAt(address(this), addr);
    }

    /// @notice Vesting information for account.
    /// @param addr The address of the oracle.
    function vestingInfoOf(address addr) external view returns (uint256 balance, uint256 stoppedInblock) {
        return supportersContract.vestingInfoOf(address(this), addr);
    }

    /// @dev Add stake internal
    function _addStake(address oracleOwner, address oracleAddr, uint256 stake) internal {
        // Transfer stake [should be approved by oracle owner first]
        token.transferFrom(oracleOwner, address(this), stake);

        // Stake at supportersContract contract
        token.approve(address(supportersContract), stake);
        supportersContract.stakeAtFrom(stake, oracleAddr, address(this));
    }


    /// @dev Unsubscribe a registered oracle from participating in all registered coin-pairs
    /// @param oracleAddr Address of oracle
    function _unsubscribeAll(address oracleAddr) internal
    {
        OracleInfoLib.OracleRegisterInfo storage data = registeredOracles.getByAddr(oracleAddr);
        require(data.isRegistered(), "Oracle is not registered");
        require(_isOwner(data), "Must be called by oracle owner");

        (address[] memory coinpairs, uint count) = getSubscribedCoinPairAddresses(oracleAddr);
        for (uint i = 0; i < count; i++)
        {
            CoinPairPrice cp = (CoinPairPrice) (coinpairs[i]);
            cp.unsubscribe(oracleAddr);
        }
    }

    // A change contract can act as the owner of an Oracle
    function _isOwner(OracleInfoLib.OracleRegisterInfo storage data) internal view returns (bool) {
        return data.isOwner(msg.sender) || governor.isAuthorizedChanger(msg.sender);
    }
}
