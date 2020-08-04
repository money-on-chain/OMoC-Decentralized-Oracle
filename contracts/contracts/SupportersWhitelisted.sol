pragma solidity 0.6.0;

import {SafeMath} from "./openzeppelin/math/SafeMath.sol";
import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";
import {SupportersWhitelistedStorage} from "./SupportersWhitelistedStorage.sol";

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersWhitelisted is SupportersWhitelistedStorage {
    using SafeMath for uint;

    // Emitted by SupportersLib
    event PayEarnings(uint256 earnings, uint256 start, uint256 end);
    event CancelEarnings(uint256 earnings, uint256 start, uint256 end);
    event AddStake(address indexed user, address indexed subaccount,
        address indexed sender, uint256 amount, uint256 mocs);
    event WithdrawStake(address indexed user, address indexed subaccount,
        address indexed destination, uint256 amount, uint256 mocs);

    event Withdraw(address indexed msg_sender, address indexed subacount,
        address indexed receiver, uint256 mocs, uint256 blockNum);

    struct LockingInfo {
        uint256 endBlock;
        uint256 amount;
    }

    mapping(address => LockingInfo) lockedMocs;
    uint256 totalLockedMocs;

    /**
     @notice Contract creation

     @param _governor The address of the contract which governs this one
     @param _wlist Initial whitelist addresses
     @param _mocToken The address of the contract which governs this one
     @param _period The address of the contract which governs this one
    */
    function initialize(IGovernor _governor, address[] calldata _wlist, IERC20 _mocToken, uint256 _period)
    external initializer {
        Governed._initialize(_governor);
        supportersData._initialize(_mocToken, _period);
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /// @notice Used by the voting machine to lock an amount of MOCs.
    /// @param mocHolder the moc holder whose mocs will be locked.
    /// @param amount amount of mocs to be locked.
    /// @param endBlock block until which the mocs will be locked.
    function lockMocs(address mocHolder, uint256 amount, uint256 endBlock) external {
        LockingInfo storage lockedMocsInfo = lockedMocs[mocHolder];
        lockedMocsInfo.endBlock = endBlock;
        lockedMocsInfo.amount = amount;
        totalLockedMocs = totalLockedMocs.add(amount);
    }

    /**
      @notice Gets total amount of locked MOCs.

      @return Total amount of locked MOCs.
    */
    function getTotalLockedMocs() external view returns (uint256) {
        return totalLockedMocs;
    }

    /**
     @notice Add to the list of contracts that can stake in this contract

     @param  _whitelisted - the override coinPair
    */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     @notice Remove from the list of contracts that can stake in this contract

     @param _whitelisted - the override coinPair
    */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._removeFromWhitelist(_whitelisted, 0);
    }


    /**
      @notice Deposit earnings that will be credited to supporters.
      @dev Earnings will be credited periodically through several blocks.
    */
    function distribute() external {
        supportersData._distribute();
    }

    /**
      @notice Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool)  {
        return supportersData._isReadyToDistribute();
    }

    /**
     Stake MOC to receive earnings on a subaccount.

     @param _mocs amount of MOC to stake
     @param _subaccount sub-account used to identify the stake
    */
    function stakeAt(uint256 _mocs, address _subaccount)
    external onlyWhitelisted(iterableWhitelistData) {
        supportersData._stakeAtFrom(_mocs, _subaccount, msg.sender);
    }

    /**
     Stake MOC to receive earnings on a subaccount.

     @param _mocs amount of MOC to stake
     @param _subaccount sub-account used to identify the stake
     @param _sender sender account that must approve and from which the funds are taken
    */
    function stakeAtFrom(uint256 _mocs, address _subaccount, address _sender)
    external onlyWhitelisted(iterableWhitelistData) {
        supportersData._stakeAtFrom(_mocs, _subaccount, _sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @return Amount of MOC transfered
    */
    function withdrawFrom(uint256 _tokens, address _subaccount)
    external onlyWhitelisted(iterableWhitelistData) returns (uint256) {
        return supportersData._withdrawFromTo(_tokens, _subaccount, msg.sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function withdrawFromTo(uint256 _tokens, address _subaccount, address _receiver)
    external onlyWhitelisted(iterableWhitelistData) returns (uint256) {
        return supportersData._withdrawFromTo(_tokens, _subaccount, _receiver);
    }

    /**
      @notice Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function getBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersData._getBalanceAt(_user, _subaccount);
    }

    /**
      @notice MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersData._getMOCBalanceAt(_user, _subaccount);
    }

    /**
      @notice Total tokens created.

      @return total amount of tokens
    */
    function getTokens() external view returns (uint256) {
        return supportersData._getTokens();
    }

    /**
      @notice MOC available for withdrawal.

      @return total amount of MOC
    */
    function getAvailableMOC() external view returns (uint256) {
        return supportersData._getAvailableMOC();
    }

    /**
      @notice Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view returns (uint256) {
        return supportersData._getEarningsAt(_block);
    }

    /**
      @notice Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function getLockedAt(uint256 _block) external view returns (uint256) {
        return supportersData._getLockedAt(_block);
    }

    /**
      @notice Return information about earnings

      @return Information about earnings
    */
    function getEarningsInfo() external view returns (uint256, uint256, uint256) {
        return supportersData._getEarningsInfo();
    }


    /// @notice The moc token address
    function mocToken() external view returns (IERC20) {
        return supportersData.mocToken;
    }

    /**
     @notice Return the round length in blocks .
     @dev During each round rewards are collected and distributed during next round.

     @return Number of blocks to distribute earnings
    */
    function period() external view returns (uint256) {
        return supportersData.period;
    }

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() external view returns (uint256) {
        return iterableWhitelistData._getWhiteListLen();
    }

    /**
     @notice Returns the address at index.

     @param _idx index to query.
    */
    function getWhiteListAtIndex(uint256 _idx) external view returns (address) {
        return iterableWhitelistData._getWhiteListAtIndex(_idx);
    }

    /**
     @notice Check if an account is whitelisted

     @param _account The account to check
    */
    function isWhitelisted(address _account) external view returns (bool) {
        return iterableWhitelistData._isWhitelisted(_account);
    }
}
