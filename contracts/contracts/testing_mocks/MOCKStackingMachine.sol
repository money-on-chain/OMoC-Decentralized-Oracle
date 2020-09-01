// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IDelayMachine} from "@moc/shared/contracts/IDelayMachine.sol";

contract MOCKStakingMachine {
    event PaymentDeposit(uint256 indexed id, address source, address destination, uint256 amount);

    IERC20 public token;
    IDelayMachine public delayAddr;
    address public destination;
    address public source;

    function initialize(IDelayMachine _delayAddr, IERC20 _token) public {
        token = _token;
        delayAddr = _delayAddr;
    }

    /// @notice Accept a deposit from an account.
    function depositFrom(
        uint256 _mocs,
        address _destination,
        address _source
    ) public {
        require(token.transferFrom(_source, address(this), _mocs), "error in transferFrom");
        destination = _destination;
        source = _source;
    }

    function withdraw(uint256 _mocs, uint256 _expiration) external returns (uint256) {
        // send to delay machine
        token.approve(address(delayAddr), _mocs);
        uint256 id = delayAddr.deposit(_mocs, destination, address(this), _expiration);
        emit PaymentDeposit(id, address(this), destination, _mocs);
        return id;
    }
}
