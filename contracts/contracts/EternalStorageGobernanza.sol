pragma solidity ^0.6.0;

import "./moc-gobernanza/Governance/Governed.sol";

// Based on https://github.com/fravoll/solidity-patterns EternalStorage
contract EternalStorageGobernanza is Governed {
    struct UIntVal {bool b; uint248 v;}

    struct BoolVal {bool b; bool v;}

    struct IntVal {bool b; int248 v;}

    struct DecimalVal {bool b; int232 base; int16 exp;}


    mapping(bytes32 => DecimalVal) decimalStorage;
    mapping(bytes32 => UIntVal) uIntStorage;
    mapping(bytes32 => string) stringStorage;
    mapping(bytes32 => address) addressStorage;
    mapping(bytes32 => bytes) bytesStorage;
    mapping(bytes32 => BoolVal) boolStorage;
    mapping(bytes32 => IntVal) intStorage;


    // *** Getter Methods ***
    function getDecimal(bytes32 _key) external view returns (int232 base, int16 exp) {
        require(decimalStorage[_key].b, "Missing key");
        return (decimalStorage[_key].base, decimalStorage[_key].exp);
    }

    function getUint(bytes32 _key) external view returns (uint248) {
        require(uIntStorage[_key].b, "Missing key");
        return uIntStorage[_key].v;
    }

    function getString(bytes32 _key) external view returns (string memory) {
        require(bytes(stringStorage[_key]).length != 0, "Missing key");
        return stringStorage[_key];
    }

    function getAddress(bytes32 _key) external view returns (address) {
        require(addressStorage[_key] != address(0), "Missing key");
        return addressStorage[_key];
    }

    function getBytes(bytes32 _key) external view returns (bytes memory) {
        require(bytesStorage[_key].length != 0, "Missing key");
        return bytesStorage[_key];
    }

    function getBool(bytes32 _key) external view returns (bool) {
        require(boolStorage[_key].b, "Missing key");
        return boolStorage[_key].v;
    }

    function getInt(bytes32 _key) external view returns (int248) {
        require(intStorage[_key].b, "Missing key");
        return intStorage[_key].v;
    }

    // *** Setter Methods ***
    function setDecimal(bytes32 _key, int232 _base, int16 _exp) onlyAuthorizedChanger external {
        decimalStorage[_key] = DecimalVal(true, _base, _exp);
    }

    function setUint(bytes32 _key, uint248 _value) onlyAuthorizedChanger external {
        uIntStorage[_key] = UIntVal(true, _value);
    }

    function setString(bytes32 _key, string calldata _value) onlyAuthorizedChanger external {
        require(bytes(_value).length != 0, "Invalid value");
        stringStorage[_key] = _value;
    }

    function setAddress(bytes32 _key, address _value) onlyAuthorizedChanger external {
        require(_value != address(0), "Invalid value");
        addressStorage[_key] = _value;
    }

    function setBytes(bytes32 _key, bytes calldata _value) onlyAuthorizedChanger external {
        require(_value.length != 0, "Invalid value");
        bytesStorage[_key] = _value;
    }

    function setBool(bytes32 _key, bool _value) onlyAuthorizedChanger external {
        boolStorage[_key] = BoolVal(true, _value);
    }

    function setInt(bytes32 _key, int248 _value) onlyAuthorizedChanger external {
        intStorage[_key] = IntVal(true, _value);
    }

    // *** Delete Methods ***
    function deleteUint(bytes32 _key) onlyAuthorizedChanger external {
        delete uIntStorage[_key];
    }

    function deleteString(bytes32 _key) onlyAuthorizedChanger external {
        delete stringStorage[_key];
    }

    function deleteAddress(bytes32 _key) onlyAuthorizedChanger external {
        delete addressStorage[_key];
    }

    function deleteBytes(bytes32 _key) onlyAuthorizedChanger external {
        delete bytesStorage[_key];
    }

    function deleteBool(bytes32 _key) onlyAuthorizedChanger external {
        delete boolStorage[_key];
    }

    function deleteInt(bytes32 _key) onlyAuthorizedChanger external {
        delete intStorage[_key];
    }
}