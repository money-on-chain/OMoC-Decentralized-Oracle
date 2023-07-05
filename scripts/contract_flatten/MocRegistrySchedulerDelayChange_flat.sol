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
  @title ChangeContract
  @notice This interface is the one used by the governance system.
  @dev If you plan to do some changes to a system governed by this project you should write a contract
  that does those changes, like a recipe. This contract MUST not have ANY kind of public or external function
  that modifies the state of this ChangeContract, otherwise you could run into front-running issues when the governance
  system is fully in place.
 */
interface ChangeContract {
    /**
      @notice Override this function with a recipe of the changes to be done when this ChangeContract
      is executed
     */
    function execute() external;
}

interface IRegistry {
    // *** Getter Methods ***
    function getDecimal(bytes32 _key) external view returns (int232 base, int16 exp);

    function getUint(bytes32 _key) external view returns (uint248);

    function getString(bytes32 _key) external view returns (string memory);

    function getAddress(bytes32 _key) external view returns (address);

    function getBytes(bytes32 _key) external view returns (bytes memory);

    function getBool(bytes32 _key) external view returns (bool);

    function getInt(bytes32 _key) external view returns (int248);

    // *** Setter Methods ***
    function setDecimal(bytes32 _key, int232 _base, int16 _exp) external;

    function setUint(bytes32 _key, uint248 _value) external;

    function setString(bytes32 _key, string calldata _value) external;

    function setAddress(bytes32 _key, address _value) external;

    function setBytes(bytes32 _key, bytes calldata _value) external;

    function setBool(bytes32 _key, bool _value) external;

    function setInt(bytes32 _key, int248 _value) external;

    // *** Delete Methods ***
    function deleteDecimal(bytes32 _key) external;

    function deleteUint(bytes32 _key) external;

    function deleteString(bytes32 _key) external;

    function deleteAddress(bytes32 _key) external;

    function deleteBytes(bytes32 _key) external;

    function deleteBool(bytes32 _key) external;

    function deleteInt(bytes32 _key) external;

    // Nov 2020 Upgrade
    // *** Getter Methods ***
    function getAddressArrayLength(bytes32 _key) external view returns (uint256);

    function getAddressArrayElementAt(bytes32 _key, uint256 idx) external view returns (address);

    function pushAddressArrayElement(bytes32 _key, address _addr) external;

    function getAddressArray(bytes32 _key) external view returns (address[] memory);

    function addressArrayContains(bytes32 _key, address value) external view returns (bool);

    // *** Setters ***
    function pushAddressArray(bytes32 _key, address[] memory data) external;

    function clearAddressArray(bytes32 _key) external;

    function removeAddressArrayElement(bytes32 _key, address value) external;
}

/**
    @title MocRegistrySchedulerDelayChange
    @notice This contract is a ChangeContract intended to change some MOC registry values
 */
contract MocRegistrySchedulerDelayChange is ChangeContract {
    IRegistry public registry;

    /**
      @notice Constructor
    */
    constructor(IRegistry _registry) public {
        registry = _registry;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        registry.setUint(getKeccak("SCHEDULER_POOL_DELAY"), 1 * 60);
        registry.setUint(getKeccak("SCHEDULER_ROUND_DELAY"), 30 * 60);
        // TODO: Make it usable just once.
    }

    function getKeccak(string memory k) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("MOC_ORACLE\\1\\", k));
    }
}
