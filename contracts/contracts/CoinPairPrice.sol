pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./openzeppelin/math/SafeMath.sol";
import "./libs/IPriceProvider.sol";
import "./CoinPairPriceGobernanza.sol";
/// @title This contract provides an interface for feeding prices from oracles, and
///        get the current price. One contract must be instanced per supported coin pair,
///        and registered through OracleManager global contract.
contract CoinPairPrice is CoinPairPriceGobernanza, IPriceProvider {
    using SafeMath for uint;

    // Contract configuration
    // ----------------------------------------------------------------------------------------------------------------

    // The subscribed oracles to this coin-pair.
    mapping(address => bool) subscribedOracles;

    struct Round
    {
        // Number of this round
        uint256 number;

        // Total points accumulated in round.
        uint256 totalPoints;

        // The starting block of period where this round is valid.
        uint256 startBlock;

        // The  block (inclusive) where this round lock terminates (can be switched out).
        uint256 lockPeriodEndBlock;

        // The selected oracles that participate in this round.
        address[] selectedOracles;
    }

    struct FullOracleRoundInfo {
        uint256 stake;
        uint256 points;
        address addr;
        address owner;
        string name;
    }

    Round currentRound;
    mapping(address => OracleInfoLib.OracleRoundInfo) oracleRoundInfo;

    using OracleInfoLib for OracleInfoLib.OracleRoundInfo;

    event OracleRewardTransfer(uint256 roundNumber, address oracleAddress, address toOwnerAddress, uint256 amount);
    event PricePublished(address sender, uint256 price, address votedOracle, uint256 blockNumber);
    event NewRound(address caller, uint256 number, uint256 totalPoints, uint256 startBlock, uint256 lockPeriodEndBlock,
        address[] selectedOracles);

    // -------------------------------------------------------------------------------------------------------------
    //
    //   Public interface
    //
    // -------------------------------------------------------------------------------------------------------------


    /// @notice subscribe an oracle to this coin pair , allowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function subscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(subscribedOracles[oracleAddr] == false, "Oracle is already subscribed to this coin pair");

        subscribedOracles[oracleAddr] = true;
        if (currentRound.selectedOracles.length < maxOraclesPerRound
            && currentRound.number > 0
            && !(oracleRoundInfo[oracleAddr].isInRound(currentRound.number))) {
            _addOracleToRound(oracleAddr);
        }
    }

    /// @notice Unsubscribe an oracle from this coin pair , disallowing it to be selected in rounds.
    /// @param oracleAddr the oracle address to subscribe to this coin pair.
    /// @dev This is designed to be called from OracleManager.
    function unsubscribe(address oracleAddr) external {
        require(msg.sender == address(oracleManager), "Must be called from Oracle manager");
        require(subscribedOracles[oracleAddr] == true, "Oracle is not subscribed to this coin pair");

        subscribedOracles[oracleAddr] = false;
    }

    /// @notice Returns true if an oracle is subscribed to this contract' coin pair
    /// @param oracleAddr the oracle address to lookup.
    /// @dev This is designed to be called from OracleManager.
    function isSubscribed(address oracleAddr) external view returns (bool) {
        return subscribedOracles[oracleAddr];
    }

    /// @notice Returns true if an oracle satisfies conditions to be removed from system.
    /// @param oracleAddr the oracle address to lookup.
    function canRemoveOracle(address oracleAddr) public view returns (bool) {
        OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[oracleAddr];
        if (data.getSelectedInRound() == 0) return true;
        return currentRound.number - data.getSelectedInRound() >= numIdleRounds;
    }

    /// @notice Return the available reward fees
    ///
    function getAvailableRewardFees() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Publish a price.
    /// @param version Version number of message format (3)
    /// @param coinpair The coin pair to report (must match this contract)
    /// @param price Price to report.
    /// @param votedOracle The address of the oracle voted as a publisher by the network.
    /// @param blockNumber The blocknumber acting as nonce to prevent replay attacks.
    /// @param sig_v The array of V-component of Oracle signatures.
    /// @param sig_r The array of R-component of Oracle signatures.
    /// @param sig_s The array of S-component of Oracle signatures.
    function publishPrice(uint256 version,
        bytes32 coinpair,
        uint256 price,
        address votedOracle,
        uint256 blockNumber,
        uint8[]  memory sig_v,
        bytes32[] memory sig_r,
        bytes32[] memory sig_s) public {

        require(currentRound.number > 0, "Round not open");
        OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[msg.sender];
        require(subscribedOracles[msg.sender], "Sender oracle not subscribed");
        require(data.isInRound(currentRound.number), "Voter oracle is not part of this round");
        require(msg.sender == votedOracle, "Your address does not match the voted oracle");
        require(version == 3, "This contract accepts only V3 format");
        require(price > 0, "Price must be positive and non-zero");
        require(blockNumber == lastPublicationBlock, "Blocknumber does not match the last publication block");
        require(coinpair == getCoinPair(), "Coin pair - contract mismatch");

        // Verify signatures
        require(sig_s.length == sig_r.length && sig_r.length == sig_v.length, "Inconsistent signature count");
        require(sig_s.length > currentRound.selectedOracles.length / 2,
            "Signature count must exceed 50% of active oracles");

        //
        // NOTE: Message Size is 148 = sizeof(uint256) +
        // sizeof(uint256) + sizeof(uint256) + sizeof(address) +sizeof(uint256)
        //

        bytes memory hData = abi.encodePacked("\x19Ethereum Signed Message:\n148",
            version, coinpair, price, votedOracle, blockNumber);
        bytes32 messageHash = keccak256(hData);

        address lastAddr = address(0);
        for (uint i = 0; i < sig_s.length; i++) {
            address rec = _recoverSigner(sig_v[i], sig_r[i], sig_s[i], messageHash);
            require(rec != address(0), "Cannot recover signature");
            require(subscribedOracles[rec], "Signing oracle not subscribed");
            require(oracleRoundInfo[rec].isInRound(currentRound.number), "Address of signer not part of this round");
            require(lastAddr < rec, "Signatures are not unique or not ordered by address");
            lastAddr = rec;
        }

        oracleRoundInfo[msg.sender].addPoints(1);
        currentRound.totalPoints = currentRound.totalPoints + 1;
        lastPublicationBlock = block.number;
        currentPrice = price;

        emit PricePublished(msg.sender, price, votedOracle, blockNumber);
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function peek() public override view returns (bytes32, bool) {
        // We use address(1) to allow calls from outside the block chain
        require(super.isWhitelisted(msg.sender) || msg.sender == address(1), "Address is not whitelisted");
        require((block.number - lastPublicationBlock) >= 0, "Wrong lastPublicationBlock");

        return (bytes32(currentPrice), (block.number - lastPublicationBlock) < validPricePeriodInBlocks);
    }

    /// @notice Return the current price, compatible with old MOC Oracle
    function getPrice() external view returns (uint256) {
        (bytes32 cp,) = peek();
        return uint256(cp);
    }

    /// @notice Return the coin pair for this contract
    function getCoinPair() public view returns (bytes32) {
        return coinPair;
    }

    /// @notice Get the last publication block
    function getLastPublicationBlock() public view returns (uint256) {
        return lastPublicationBlock;
    }

    /// @notice Get the valid price period in blocks
    function getValidPricePeriodInBlocks() public view returns (uint256) {
        return validPricePeriodInBlocks;
    }

    /// @notice Return current round information
    function getRoundInfo() public view returns (uint256 round,
        uint256 startBlock,
        uint256 lockPeriodEndBlock,
        uint256 totalPoints,
        address[] memory selectedOracles) {
        return (currentRound.number, currentRound.startBlock, currentRound.lockPeriodEndBlock,
        currentRound.totalPoints, currentRound.selectedOracles);
    }

    /// @notice Return round information for specific oracle
    function getOracleRoundInfo(address addr) public view returns (uint points, uint256 selectedInRound,
        bool selectedInCurrentRound) {
        return (oracleRoundInfo[addr].points, oracleRoundInfo[addr].selectedInRound,
        oracleRoundInfo[addr].selectedInRound == currentRound.number);
    }

    /// @notice Return all the information needed by the oracle server (one call, to avoid a lot of rpc)
    function getOracleServerInfo() public view returns (
        uint256 round, uint256 startBlock, uint256 lockPeriodEndBlock, uint256 totalPoints,
        FullOracleRoundInfo[] memory info,
        uint256 price,
        uint256 currentBlock,
        uint256 lastPubBlock,
        bytes32 lastPubBlockHash,
        uint256 validPricePeriodInBlocks
    )
    {
        uint256 len = currentRound.selectedOracles.length;
        info = new FullOracleRoundInfo[](len);
        for (uint i = 0; i < len; i++) {
            address addr = currentRound.selectedOracles[i];
            (string memory name, uint stake, address owner) = oracleManager.getOracleRegistrationInfo(addr);
            info[i] = FullOracleRoundInfo(
                stake,
                oracleRoundInfo[addr].points,
                addr,
                owner,
                name);
        }
        return (currentRound.number, currentRound.startBlock, currentRound.lockPeriodEndBlock, currentRound.totalPoints,
        info, currentPrice, block.number, lastPublicationBlock, blockhash(lastPublicationBlock), validPricePeriodInBlocks);
    }


    /// @notice Switch contract context to a new round. With the objective of
    /// being a decentralized solution, this can be called by *anyone* if current
    /// round lock period is expired.
    function switchRound() public {
        if (currentRound.number > 0) // Not before the first round
        {
            require(block.number > currentRound.lockPeriodEndBlock, "The current round lock period is active");
            _distributeRewards();
        }

        _clearOracleState();

        // Setup new round parameters

        currentRound.number = currentRound.number + 1;
        currentRound.totalPoints = 0;
        currentRound.startBlock = block.number + 1;
        currentRound.lockPeriodEndBlock = block.number + 1 + roundLockPeriodInBlocks;

        // Select top stake oracles to participate on this round

        _selectOraclesForRound();

        emit NewRound(msg.sender, currentRound.number, currentRound.totalPoints, currentRound.startBlock,
            currentRound.lockPeriodEndBlock, currentRound.selectedOracles);
    }

    // ----------------------------------------------------------------------------------------------------------------
    // Internal functions
    // ----------------------------------------------------------------------------------------------------------------

    function _clearOracleState() private {
        for (uint i = 0; i < currentRound.selectedOracles.length; i++) {
            OracleInfoLib.OracleRoundInfo storage data = oracleRoundInfo[currentRound.selectedOracles[i]];
            data.clearPoints();
        }
    }

    /// @notice Distribute rewards to oracles, taking fees from this smart contract.
    function _distributeRewards() private {
        assert(currentRound.number > 0);

        uint256 availableRewardFees = token.balanceOf(address(this));
        if (currentRound.totalPoints == 0 || availableRewardFees == 0)
            return;

        // Distribute according to points/TotalPoints ratio
        uint256 distSum = 0;
        for (uint i = 0; i < currentRound.selectedOracles.length; i++) {
            address oracleAddr = currentRound.selectedOracles[i];
            uint256 points = oracleRoundInfo[oracleAddr].points;
            uint256 distAmount = ((points).mul(availableRewardFees)).div(currentRound.totalPoints);
            (,, address owneraddr) = oracleManager.getOracleRegistrationInfo(oracleAddr);

            require(token.transfer(owneraddr, distAmount), "Token transfer failed");
            distSum = distSum.add(distAmount);
            emit OracleRewardTransfer(currentRound.number, oracleAddr, owneraddr, distAmount);
        }
    }

    /// @notice Select top-stakers for the current round. Only subscribed oracles to this contract are
    /// considered for selection.
    function _selectOraclesForRound() private {

        delete currentRound.selectedOracles;
        for (address addr = oracleManager.getRegisteredOracleHead();
            addr != address(0) && currentRound.selectedOracles.length < maxOraclesPerRound;
            addr = oracleManager.getRegisteredOracleNext(addr))
        {
            if (subscribedOracles[addr]) {
                _addOracleToRound(addr);
            }
        }
    }

    function _addOracleToRound(address addr) internal {
        currentRound.selectedOracles.push(addr);
        oracleRoundInfo[addr].setSelectedInRound(currentRound.number);
    }

    /// @notice Recover signer address from v,r,s signature components and hash
    ///
    function _recoverSigner(uint8 v, bytes32 r, bytes32 s, bytes32 hash) internal pure returns (address) {
        if (r.length != 32 || s.length != 32) {
            return (address(0));
        }
        uint8 v0 = v;

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v0 < 27) {
            v0 += 27;
        }

        // If the version is correct return the signer address
        if (v0 != 27 && v0 != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v0, r, s);
        }
    }
}
