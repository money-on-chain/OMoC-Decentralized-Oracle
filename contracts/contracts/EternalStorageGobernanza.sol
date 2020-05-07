pragma solidity ^0.6.0;

import "./moc-gobernanza/Governance/Governed.sol";

// Based on https://github.com/fravoll/solidity-patterns EternalStorage
contract EternalStorageGobernanza is Governed {
    mapping(bytes32 => uint) uIntStorage;
    mapping(bytes32 => string) stringStorage;
    mapping(bytes32 => address) addressStorage;
    mapping(bytes32 => bytes) bytesStorage;
    mapping(bytes32 => bool) boolStorage;
    mapping(bytes32 => int) intStorage;


    // *** Getter Methods ***
    function getUint(bytes32 _key) external view returns (uint) {
        return uIntStorage[_key];
    }

    function getString(bytes32 _key) external view returns (string memory) {
        return stringStorage[_key];
    }

    function getAddress(bytes32 _key) external view returns (address) {
        return addressStorage[_key];
    }

    function getBytes(bytes32 _key) external view returns (bytes memory) {
        return bytesStorage[_key];
    }

    function getBool(bytes32 _key) external view returns (bool) {
        return boolStorage[_key];
    }

    function getInt(bytes32 _key) external view returns (int) {
        return intStorage[_key];
    }

    // *** Setter Methods ***
    function setUint(bytes32 _key, uint _value) onlyAuthorizedChanger external {
        uIntStorage[_key] = _value;
    }

    function setString(bytes32 _key, string calldata _value) onlyAuthorizedChanger external {
        stringStorage[_key] = _value;
    }

    function setAddress(bytes32 _key, address _value) onlyAuthorizedChanger external {
        addressStorage[_key] = _value;
    }

    function setBytes(bytes32 _key, bytes calldata _value) onlyAuthorizedChanger external {
        bytesStorage[_key] = _value;
    }

    function setBool(bytes32 _key, bool _value) onlyAuthorizedChanger external {
        boolStorage[_key] = _value;
    }

    function setInt(bytes32 _key, int _value) onlyAuthorizedChanger external {
        intStorage[_key] = _value;
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