pragma solidity 0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import {Initializable} from "./openzeppelin/Initializable.sol";
import {IterableWhitelist} from "./libs/IterableWhitelist.sol";
import {SupportersVestedAbstract} from "./SupportersVestedAbstract.sol";
import {GovernedAbstract} from "./GovernedAbstract.sol";
import {IGovernor} from "./moc-gobernanza/Governance/IGovernor.sol";
import {Governed} from "./moc-gobernanza/Governance/Governed.sol";

/*
    Right now we have two things implemented in the same smart-contract:
        - Only the smart-contracts in the whitelist can access this one.
        - Some vesting rules implemented in SupportersVestedAbstract
    This can be split in the future in two smart-contracts if we want to add a specific set
    of vesting rules (that doesn't do what SupportersVestedAbstract does).
*/
contract SupportersWhitelisted is Initializable, IterableWhitelist, SupportersVestedAbstract, GovernedAbstract {

    /**
    Contract creation

    @param _governor The address of the contract which governs this one
    @param _wlist Initial whitelist addresses
    @param _mocToken The address of the contract which governs this one
    @param _period The address of the contract which governs this one
    @param _minStayBlocks The address of the contract which governs this one
    @param _afterStopBlocks The address of the contract which governs this one
    */
    function initialize(IGovernor _governor, address[] memory _wlist, IERC20 _mocToken, uint256 _period
    , uint256 _minStayBlocks, uint256 _afterStopBlocks) public initializer {
        Governed._initialize(_governor);
        SupportersVestedAbstract._initialize(_mocToken, _period, _minStayBlocks, _afterStopBlocks);
        for (uint256 i = 0; i < _wlist.length; i++) {
            IterableWhitelist.add(_wlist[i]);
        }
    }

    /**
     * @dev Add to the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        IterableWhitelist.add(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        IterableWhitelist.remove(_whitelisted);
    }

    /**
      * @dev Sets the period by gobernanza
      * @param _period- the override minOracleOwnerStake
      */
    function setPeriod(uint256 _period) external onlyAuthorizedChanger() {
        super._setPeriod(_period);
    }


    /**
      Stake MOC to receive earnings.

      @param _mocs amount of MOC to stake
    */

    /**
      Deposit earnings that will be credited to supporters.
      Earnings will be credited periodically through several blocks.
    */
    function distribute() external {
        super._distribute();
    }

    /**
      Return true if is ready to do a distribute call

      @return true if ready
    */
    function isReadyToDistribute() external view returns (bool)  {
        return super._isReadyToDistribute();
    }

    /**
      Stake MOC to receive earnings on a subaccount.

      @param _mocs amount of MOC to stake
      @param _subaccount sub-account used to identify the stake
    */
    function stakeAt(uint256 _mocs, address _subaccount) external onlyWhitelisted(msg.sender) {
        super._stakeAtFrom(_mocs, _subaccount, msg.sender);
    }

    /**
    Stake MOC to receive earnings on a subaccount.

    @param _mocs amount of MOC to stake
    @param _subaccount sub-account used to identify the stake
    @param _sender sender account that must approve and from which the funds are taken
    */
    function stakeAtFrom(uint256 _mocs, address _subaccount, address _sender) external onlyWhitelisted(msg.sender) {
        super._stakeAtFrom(_mocs, _subaccount, _sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @return Amount of MOC transfered
    */
    function withdrawFrom(uint256 _tokens, address _subaccount) external onlyWhitelisted(msg.sender) returns (uint256) {
        return super._withdrawFromTo(_tokens, _subaccount, msg.sender);
    }

    /**
      Withdraw MOC for tokens for a subaccount.

      @param _tokens amount of tokens to convert to MOC
      @param _subaccount subaccount used to withdraw MOC
      @param _receiver destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function withdrawFromTo(uint256 _tokens, address _subaccount, address _receiver) external onlyWhitelisted(msg.sender) returns (uint256) {
        return super._withdrawFromTo(_tokens, _subaccount, _receiver);
    }

    /// @notice Returns true if a supporter can withdraw his money
    //  @param _subaccount subaccount used to withdraw MOC
    function canWithdraw(address _subaccount) external view returns (bool) {
        return super._canWithdraw(_subaccount);
    }

    /**
      Amount of tokens for _user in a _subaccount.

      @param _user User address
      @param _subaccount subaccount to get balance
      @return tokens for _user at _subaccount
    */
    function getBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return super._getBalanceAt(_user, _subaccount);
    }

    /**
      MOC available for withdrawal by _user.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return MOC for _user
    */
    function getMOCBalanceAt(address _user, address _subaccount) external view returns (uint256) {
        return super._getMOCBalanceAt(_user, _subaccount);
    }

    /**
      Total tokens created.

      @return total amount of tokens
    */
    function getTokens() external view returns (uint256) {
        return super._getTokens();
    }

    /**
      MOC available for withdrawal.

      @return total amount of MOC
    */
    function getAvailableMOC() external view returns (uint256) {
        return super._getAvailableMOC();
    }

    /**
      Calculate earnings to be paid at a block

      @param _block Block used to calculate
      @return Earnings to be paid
    */
    function getEarningsAt(uint256 _block) external view returns (uint256) {
        return super._getEarningsAt(_block);
    }

    /**
      Calculate locked earnings at a block

      @param _block Block used for calculations
      @return Locked amount of earnings in MOC
    */
    function getLockedAt(uint256 _block) external view returns (uint256) {
        return super._getLockedAt(_block);
    }

    /**
      @dev Return information about earnings

      @return Information about earnings
    */
    function getEarningsInfo() external view returns (uint256, uint256, uint256) {
        return super._getEarningsInfo();
    }


    ////////////////////////////////////////////////////////////// SupportersVestedAbstract

    /**
      * @dev Sets the minStayBlocks by gobernanza
      * @param _minStayBlocks- the override minStayBlocks
      */
    function setMinStayBlocks(uint256 _minStayBlocks) external onlyWhitelisted(msg.sender) {
        super._setMinStayBlocks(_minStayBlocks);
    }

    /**
      * @dev Sets the afterStopBlocks by gobernanza
      * @param _afterStopBlocks - the override afterStopBlocks
    */
    function setAfterStopBlocks(uint256 _afterStopBlocks) external onlyWhitelisted(msg.sender) {
        super._setAfterStopBlocks(_afterStopBlocks);
    }

    /**
     Stop staking some MOCs
    */
    function stop(address addr) external onlyWhitelisted(msg.sender) {
        super._stop(addr);
    }

    /**
      Vesting information for _account.

      @param _user User address
      @param _subaccount subaccount to get MOC balance
      @return balance stoppedInblock balance
      @return stoppedInblock the block in which the mocs where stopped
    */
    function vestingInfoOf(address _user, address _subaccount) external view returns (uint256 balance, uint256 stoppedInblock) {
        require(_subaccount != address(0), "Address must be != 0");
        return (this.getMOCBalanceAt(_user, _subaccount), stopInBlockMap[_subaccount]);
    }

    ////////////////////////////////////////////////////////////// SupportersVestedAbstract END

}
