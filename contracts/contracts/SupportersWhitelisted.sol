pragma solidity ^0.6.0;

import {IERC20} from "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/Initializable.sol";
import "./libs/IterableWhitelist.sol";
import "./SupportersAbstract.sol";
import "./moc-gobernanza/Governance/Governed.sol";

contract SupportersWhitelisted is Initializable, IterableWhitelist, SupportersAbstract, Governed {

    function initialize(IGovernor _governor, address[] memory wlist, IERC20 _mocToken, uint256 _period) public initializer {
        Governed.initialize(_governor);
        SupportersAbstract._initialize(_mocToken, _period);
        for (uint256 i = 0; i < wlist.length; i++) {
            super.add(wlist[i]);
        }
    }

    /**
     * @dev Add to the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function addToWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        super.add(_whitelisted);
    }

    /**
     * @dev Remove from the list of contracts that can stake in this contract
     * @param  _whitelisted - the override coinPair
     */
    function removeFromWhitelist(address _whitelisted) public onlyAuthorizedChanger() {
        super.remove(_whitelisted);
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
      @param _destination destination address that gets the MOC
      @return Amount of MOC transfered
    */
    function withdrawFromTo(uint256 _tokens, address _subaccount, address _destination) external onlyWhitelisted(msg.sender) returns (uint256) {
        return super._withdrawFromTo(_tokens, _subaccount, _destination);
    }

    /**
      Amount of tokens for _user.

      @param _user User address
      @return tokens for _user
    */
    function getBalance(address _user) external view returns (uint256) {
        return super._getBalanceAt(_user, _user);
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
      @return MOC for _user
    */
    function getMOCBalance(address _user) external view returns (uint256) {
        return super._getMOCBalanceAt(_user, _user);
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
}
