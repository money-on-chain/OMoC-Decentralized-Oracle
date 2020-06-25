pragma solidity 0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {IterableWhitelistLib, IIterableWhitelist} from "./libs/IterableWhitelistLib.sol";
import {SupportersVestedLib} from "./libs/SupportersVestedLib.sol";
import {SupportersLib} from "./libs/SupportersLib.sol";
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

    using SupportersLib for SupportersLib.SupportersData;
    /**
    Contract creation

    @param _governor The address of the contract which governs this one
    @param _wlist Initial whitelist addresses
    @param _mocToken The address of the contract which governs this one
    @param _period The address of the contract which governs this one
    @param _minStayBlocks The address of the contract which governs this one
    @param _afterStopBlocks The address of the contract which governs this one
    */
    function initialize(IGovernor _governor, address[] calldata _wlist, IERC20 _mocToken, uint256 _period
    , uint256 _minStayBlocks, uint256 _afterStopBlocks)
    external initializer {
        Governed._initialize(_governor);
        supportersVestedData._initialize(_mocToken, _period, _minStayBlocks, _afterStopBlocks);
        for (uint256 i = 0; i < _wlist.length; i++) {
            iterableWhitelistData._addToWhitelist(_wlist[i]);
        }
    }

    /**
     * @dev Add to the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._addToWhitelist(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) external onlyAuthorizedChanger() {
        iterableWhitelistData._removeFromWhitelist(_whitelisted);
    }


    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
    */
    function distribute() external {
        supportersVestedData.supportersData._distribute();
    }

    /**
      Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool)  {
        return supportersVestedData.supportersData._isReadyToDistribute();
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
    */
    function stakeAt(uint256 _mocs, address _subaccount)
    external onlyWhitelisted(iterableWhitelistData) {
        supportersVestedData._stakeAtFrom(_mocs, _subaccount, msg.sender);
    }

    /**
    Stake MOC to receive earnings on a subaccount.

    @param _mocs amount of MOC to stake
    @param _subaccount sub-account used to identify the stake
    @param _sender sender account that must approve and from which the funds are taken
    */
    function stakeAtFrom(uint256 _mocs, address _subaccount, address _sender)
    external onlyWhitelisted(iterableWhitelistData) {
        supportersVestedData._stakeAtFrom(_mocs, _subaccount, _sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @return Amount of MOC transfered
    */
    function withdrawFrom(uint256 _tokens, address _subaccount)
    external onlyWhitelisted(iterableWhitelistData) returns (uint256) {
        return supportersVestedData._withdrawFromTo(_tokens, _subaccount, msg.sender);
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
        return supportersVestedData._withdrawFromTo(_tokens, _subaccount, _receiver);
    }

    /// @notice Returns true if a supporter can withdraw his money
    //  @param _subaccount subaccount used to withdraw MOC
    function canWithdraw(address _subaccount) external view returns (bool) {
        return supportersVestedData._canWithdraw(_subaccount);
    }

    /**
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function getBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersVestedData.supportersData._getBalanceAt(_user, _subaccount);
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return supportersVestedData.supportersData._getMOCBalanceAt(_user, _subaccount);
    }

    /**
      Total tokens created.

      @return total amount of tokens
    */
    function getTokens() external view returns (uint256) {
        return supportersVestedData.supportersData._getTokens();
    }

    /**
      MOC available for withdrawal.

      @return total amount of MOC
    */
    function getAvailableMOC() external view returns (uint256) {
        return supportersVestedData.supportersData._getAvailableMOC();
    }

    /**
      Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view returns (uint256) {
        return supportersVestedData.supportersData._getEarningsAt(_block);
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function getLockedAt(uint256 _block) external view returns (uint256) {
        return supportersVestedData.supportersData._getLockedAt(_block);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function getEarningsInfo() external view returns (uint256, uint256, uint256) {
        return supportersVestedData.supportersData._getEarningsInfo();
    }


    /**
      @return The moc token address
    */
    function mocToken() external view returns (IERC20) {
        return supportersVestedData.supportersData.mocToken;
    }

    /**
      @return Number of blocks to distribute earnings
    */
    function period() external view returns (uint256) {
        return supportersVestedData.supportersData.period;
    }

    /**
     Stop staking some MOCs
    */
    function stop(address addr) external onlyWhitelisted(iterableWhitelistData) {
        supportersVestedData._stop(addr);
    }

    /**
      Vesting information for _account.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return balance stoppedInblock balance
      @return stoppedInblock the block in which the mocs where stopped
    */
    function vestingInfoOf(address _user, address _subaccount)
    external view returns (uint256 balance, uint256 stoppedInblock) {
        require(_subaccount != address(0), "Address must be != 0");
        return (supportersVestedData.supportersData._getMOCBalanceAt(_user, _subaccount),
        supportersVestedData.stopInBlockMap[_subaccount]);
    }

    /**
      Get the minimum number of blocks that a user must stay staked after staking

      @return the minimum number of blocks that a user must stay staked after staking
    */
    function getMinStayBlocks() external view returns (uint256) {
        return supportersVestedData.minStayBlocks;
    }

    /**
      Return the period of blocks a user have after a stop and minStayBlock to withdraw

      @return the period of blocks that a user have
    */
    function getAfterStopBlocks() external view returns (uint256) {
        return supportersVestedData.afterStopBlocks;
    }

    /// @notice Returns the count of whitelisted addresses.
    function getWhiteListLen() external view returns (uint256) {
        return iterableWhitelistData._getWhiteListLen();
    }

    /// @notice Returns the address at index.
    /// @param i index to query.
    function getWhiteListAtIndex(uint256 i) external view returns (address) {
        return iterableWhitelistData._getWhiteListAtIndex(i);
    }

    /**
     * @dev Check if an account is whitelisted
     * @return Bool
     */
    function isWhitelisted(address account) external view returns (bool) {
        return iterableWhitelistData._isWhitelisted(account);
    }
}
