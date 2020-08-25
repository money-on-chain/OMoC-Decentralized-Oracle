// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {OwnableUpgradeSafe} from "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import {ReentrancyGuardUpgradeSafe} from "@openzeppelin/contracts-ethereum-package/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "./ChangeContract.sol";
import "./IGovernor.sol";

/**
  @title Governor
  @notice Basic governor that handles its governed contracts changes
  through trusting an external address
  */
contract Governor is Initializable, ReentrancyGuardUpgradeSafe, OwnableUpgradeSafe, IGovernor {

    address private currentChangeContract;

    function initialize(address sender) initializer public {
        //    Ownable.initialize(sender);
        __Ownable_init();
        transferOwnership(sender);
        __ReentrancyGuard_init();
    }

    /**
      @notice Function to be called to make the changes in changeContract
      @param changeContract Address of the contract that will execute the changes
     */
    function executeChange(ChangeContract changeContract) external nonReentrant onlyOwner override {
        enableChangeContract(changeContract);
        changeContract.execute();
        disableChangeContract();
    }

    /**
      @notice Returns true if the _changer address is currently authorized to make
      changes within the system
      @param _changer Address of the contract that will be tested
     */
    function isAuthorizedChanger(address _changer) external view override returns (bool)  {
        return currentChangeContract == _changer;
    }

    /**
      @notice Authorize the changeContract address to make changes
      @param changeContract Address of the contract that will be authorized
     */
    function enableChangeContract(ChangeContract changeContract) internal {
        currentChangeContract = address(changeContract);
    }

    /**
      @notice UNAuthorize the currentChangeContract address to make changes
     */
    function disableChangeContract() internal {
        currentChangeContract = address(0x0);
    }

    // Leave a gap betweeen inherited contracts variables in order to be
    // able to add more variables in them later
    uint256[50] private upgradeGap;
}
