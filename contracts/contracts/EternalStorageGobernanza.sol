// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {Governed} from "@moc/shared/contracts/moc-governance/Governance/Governed.sol";
import {IGovernor} from "@moc/shared/contracts/moc-governance/Governance/IGovernor.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

// Based on https://github.com/fravoll/solidity-patterns EternalStorage
contract EternalStorageGobernanza is Initializable, Governed {
    struct UIntVal {
        bool b;
        uint248 v;
    }

    struct BoolVal {
        bool b;
        bool v;
    }

    struct IntVal {
        bool b;
        int248 v;
    }

    struct DecimalVal {
        bool b;
        int232 base;
        int16 exp;
    }

    mapping(bytes32 => DecimalVal) internal decimalStorage;
    mapping(bytes32 => UIntVal) internal uIntStorage;
    mapping(bytes32 => string) internal stringStorage;
    mapping(bytes32 => address) internal addressStorage;
    mapping(bytes32 => bytes) internal bytesStorage;
    mapping(bytes32 => BoolVal) internal boolStorage;
    mapping(bytes32 => IntVal) internal intStorage;

    /**
      @notice Initialize the contract with the basic settings
      @dev This initialize replaces the constructor but it is not called automatically.
      It is necessary because of the upgradeability of the contracts
      @param _governor Governor address
     */
    function initialize(IGovernor _governor) external initializer {
        Governed._initialize(_governor);
    }

    // *** Getter Methods ***
    function getDecimal(bytes32 _key) external view returns (int232 base, int16 exp) {
        require(decimalStorage[_key].b, "Key does not match with existent key/value pair");
        return (decimalStorage[_key].base, decimalStorage[_key].exp);
    }

    function getUint(bytes32 _key) external view returns (uint248) {
        require(uIntStorage[_key].b, "Key does not match with existent key/value pair");
        return uIntStorage[_key].v;
    }

    function getString(bytes32 _key) external view returns (string memory) {
        require(
            bytes(stringStorage[_key]).length != 0,
            "Key does not match with existent key/value pair"
        );
        return stringStorage[_key];
    }

    function getAddress(bytes32 _key) external view returns (address) {
        require(
            addressStorage[_key] != address(0),
            "Key does not match with existent key/value pair"
        );
        return addressStorage[_key];
    }

    function getBytes(bytes32 _key) external view returns (bytes memory) {
        require(bytesStorage[_key].length != 0, "Key does not match with existent key/value pair");
        return bytesStorage[_key];
    }

    function getBool(bytes32 _key) external view returns (bool) {
        require(boolStorage[_key].b, "Key does not match with existent key/value pair");
        return boolStorage[_key].v;
    }

    function getInt(bytes32 _key) external view returns (int248) {
        require(intStorage[_key].b, "Key does not match with existent key/value pair");
        return intStorage[_key].v;
    }

    // *** Setter Methods ***
    function setDecimal(
        bytes32 _key,
        int232 _base,
        int16 _exp
    ) external onlyAuthorizedChanger {
        decimalStorage[_key] = DecimalVal(true, _base, _exp);
    }

    function setUint(bytes32 _key, uint248 _value) external onlyAuthorizedChanger {
        uIntStorage[_key] = UIntVal(true, _value);
    }

    function setString(bytes32 _key, string calldata _value) external onlyAuthorizedChanger {
        require(bytes(_value).length != 0, "Invalid value");
        stringStorage[_key] = _value;
    }

    function setAddress(bytes32 _key, address _value) external onlyAuthorizedChanger {
        require(_value != address(0), "Invalid value");
        addressStorage[_key] = _value;
    }

    function setBytes(bytes32 _key, bytes calldata _value) external onlyAuthorizedChanger {
        require(_value.length != 0, "Invalid value");
        bytesStorage[_key] = _value;
    }

    function setBool(bytes32 _key, bool _value) external onlyAuthorizedChanger {
        boolStorage[_key] = BoolVal(true, _value);
    }

    function setInt(bytes32 _key, int248 _value) external onlyAuthorizedChanger {
        intStorage[_key] = IntVal(true, _value);
    }

    // *** Delete Methods ***
    function deleteDecimal(bytes32 _key) external onlyAuthorizedChanger {
        delete decimalStorage[_key];
    }

    function deleteUint(bytes32 _key) external onlyAuthorizedChanger {
        delete uIntStorage[_key];
    }

    function deleteString(bytes32 _key) external onlyAuthorizedChanger {
        delete stringStorage[_key];
    }

    function deleteAddress(bytes32 _key) external onlyAuthorizedChanger {
        delete addressStorage[_key];
    }

    function deleteBytes(bytes32 _key) external onlyAuthorizedChanger {
        delete bytesStorage[_key];
    }

    function deleteBool(bytes32 _key) external onlyAuthorizedChanger {
        delete boolStorage[_key];
    }

    function deleteInt(bytes32 _key) external onlyAuthorizedChanger {
        delete intStorage[_key];
    }
}
