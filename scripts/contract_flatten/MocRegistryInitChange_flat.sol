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

// Autogenerated by registryConstants.js
// solhint-disable func-name-mixedcase

contract RegistryConstants {
    // MOC_PROJECT_VERSION = keccak256(moc.project.version)
    bytes32 public constant MOC_PROJECT_VERSION =
        0xc1c87e0508bb8270ee6a6dbe630baa072e6e3d5968981666724b9333430e1c31;

    // MOC_TOKEN = keccak256(moc.token)
    bytes32 public constant MOC_TOKEN =
        0x4bd5e7ff929fdd1ba62a33f76e0f40e97bb35e8bf126c0d9d91ce5c69a4bc521;

    // MOC_DELAY_MACHINE = keccak256(moc.delay-machine)
    bytes32 public constant MOC_DELAY_MACHINE =
        0x66b60892ff6e7f0da16db27046f5960fdfd6bce5c3c8c21d56ccca3236a6281b;

    // MOC_STAKING_MACHINE = keccak256(moc.staking-machine)
    bytes32 public constant MOC_STAKING_MACHINE =
        0x3c557531fea67120f21bc7711270a96f1b8cff3dfe3dd798a8a9f09ce9b77972;

    // MOC_VESTING_MACHINE = keccak256(moc.vesting-machine)
    bytes32 public constant MOC_VESTING_MACHINE =
        0x7dfea4fb968e2599cdb7b3028c07d0188d0f92d1d00bd95c2805523c224649dd;

    // MOC_VOTING_MACHINE = keccak256(moc.voting-machine)
    bytes32 public constant MOC_VOTING_MACHINE =
        0xc0ded27704f62d8726fdbd83648113d9fd8cf32c09f80523d2ba523e0bbd5ba4;

    // MOC_UPGRADE_DELEGATOR = keccak256(moc.upgrade-delegator)
    bytes32 public constant MOC_UPGRADE_DELEGATOR =
        0x631bcbb9b033f9c8d13c32cf6e60827348d77b91b58c295e87745219242cca22;

    // MOC_PRICE_PROVIDER_REGISTRY = keccak256(moc.price-provider-registy)
    bytes32 public constant MOC_PRICE_PROVIDER_REGISTRY =
        0xd4ed72d0bf9bae5e1e7ae31a372a37c8069168889284ec94be25b3f6707f5b4a;

    // MOC_VOTING_MACHINE_MIN_STAKE = keccak256(moc.voting-machine.minStake)
    bytes32 public constant MOC_VOTING_MACHINE_MIN_STAKE =
        0x580be8e098dd1016787d59c2a534bf9df9ec679a29de4c8f92dc3807f7d7d54d;

    // MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA = keccak256(moc.voting-machine.preVoteExpirationTimeDelta)
    bytes32 public constant MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA =
        0x62f5dbf0c17b0df83487409f747ad2eeca5fd54c140ca59b32cf39d6f6eaf916;

    // MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS = keccak256(moc.voting-machine.maxPreProposals)
    bytes32 public constant MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS =
        0xc32b9cbc59039d297e670e7c196424308c90ba4a437fa7ccd008498c934e7dbf;

    // MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN = keccak256(moc.voting-machine.preVoteMinPCToWin)
    bytes32 public constant MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN =
        0x0a1b21dfd7e4f3741529cf579e2731e847d81bbf13a82d0eba6910d7ac4c1c0a;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO = keccak256(moc.voting-machine.voteMinPctToVeto)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO =
        0xfb2d33acd65c36f68a15f8fe41cb8c0dd1eda164ffa87c6882e685ccb1c1adfb;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM = keccak256(moc.voting-machine.voteMinPctForQuorum)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM =
        0xde1ede48948567c43c504b761af8cd6af5363fafeceb1239b3083955d809714f;

    // MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT = keccak256(moc.voting-machine.voteMinPctToAccept)
    bytes32 public constant MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT =
        0x99f83ee0c57b325f3deafb536d55596743ff112c6ac0d853d5f4f89b75dec045;

    // MOC_VOTING_MACHINE_PCT_PRECISION = keccak256(moc.voting-machine.PCTPrecision)
    bytes32 public constant MOC_VOTING_MACHINE_PCT_PRECISION =
        0x73ee596441ef88c207a7a9147d62f59186b4991555e37b7ce9c801f9539d1050;

    // MOC_VOTING_MACHINE_VOTING_TIME_DELTA = keccak256(moc.voting-machine.votingTimeDelta)
    bytes32 public constant MOC_VOTING_MACHINE_VOTING_TIME_DELTA =
        0xb43ee0a5ee6dcc7115ce824e4e353526ad6e479afa4daeb78451070de942de36;

    // ORACLE_MANAGER_ADDR = keccak256(MOC_ORACLE\1\ORACLE_MANAGER_ADDR)
    bytes32 public constant ORACLE_MANAGER_ADDR =
        0x16986f74674f2ed21d50b6e74e6b12bb323ff4f72364542fd5de5104f3cc3ca9;

    // SUPPORTERS_ADDR = keccak256(MOC_ORACLE\1\SUPPORTERS_ADDR)
    bytes32 public constant SUPPORTERS_ADDR =
        0xe4f979504d2a7a24557a15195eb83131e7c4a66d33900454705435aa5a6ee086;

    // INFO_ADDR = keccak256(MOC_ORACLE\1\INFO_ADDR)
    bytes32 public constant INFO_ADDR =
        0xda9f12e01fc92de345bb741448d36ecb967052dd7aa1670439af833c9a3d78f1;

    // ORACLE_PRICE_FETCH_RATE = keccak256(MOC_ORACLE\1\ORACLE_PRICE_FETCH_RATE)
    bytes32 public constant ORACLE_PRICE_FETCH_RATE =
        0x945f72e5d44fb0ce3b1de393d19415723b79f97ad801089d8470d1c20e15ffef;

    // ORACLE_BLOCKCHAIN_INFO_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_BLOCKCHAIN_INFO_INTERVAL)
    bytes32 public constant ORACLE_BLOCKCHAIN_INFO_INTERVAL =
        0x11cfbdf601b80a575e4366f0234cc06de0c9f401fe250dd9dccfccefeedb6fc2;

    // ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL)
    bytes32 public constant ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL =
        0x2f271dc1fa81985bda14a2d6d0d60b45191d2a2d97e636b192696a8796d654a7;

    // ORACLE_MAIN_LOOP_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_MAIN_LOOP_TASK_INTERVAL)
    bytes32 public constant ORACLE_MAIN_LOOP_TASK_INTERVAL =
        0x275d8a46b817572476d2d55b41c7709dee307740bad676a9693805003a48d231;

    // ORACLE_PRICE_REJECT_DELTA_PCT = keccak256(MOC_ORACLE\1\ORACLE_PRICE_REJECT_DELTA_PCT)
    bytes32 public constant ORACLE_PRICE_REJECT_DELTA_PCT =
        0x7a3ee46ca1bd3e19089870d8d6530b083a86da93aab52efccb32d5950e2709cf;

    // ORACLE_CONFIGURATION_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_CONFIGURATION_TASK_INTERVAL)
    bytes32 public constant ORACLE_CONFIGURATION_TASK_INTERVAL =
        0xb027f2006a45346de89db4c5efc53f4e05e96532d27366aff00367a394d0abc4;

    // ORACLE_GATHER_SIGNATURE_TIMEOUT = keccak256(MOC_ORACLE\1\ORACLE_GATHER_SIGNATURE_TIMEOUT)
    bytes32 public constant ORACLE_GATHER_SIGNATURE_TIMEOUT =
        0xf75b08b2b912abdbb87cc459ca0b4fdc019329386ec84ab68399b0c86fed5a95;

    // ORACLE_MAIN_EXECUTOR_TASK_INTERVAL = keccak256(MOC_ORACLE\1\ORACLE_MAIN_EXECUTOR_TASK_INTERVAL)
    bytes32 public constant ORACLE_MAIN_EXECUTOR_TASK_INTERVAL =
        0xb324a91be1ac0d0c4888c835aee124ca1a7caf4b73ce10aa3504e2683865d7e5;

    // SCHEDULER_POOL_DELAY = keccak256(MOC_ORACLE\1\SCHEDULER_POOL_DELAY)
    bytes32 public constant SCHEDULER_POOL_DELAY =
        0x6c2abc911c0fa4c73b90c7143a9f4429749be45ebfe7b81e69b86e7ca440d811;

    // SCHEDULER_ROUND_DELAY = keccak256(MOC_ORACLE\1\SCHEDULER_ROUND_DELAY)
    bytes32 public constant SCHEDULER_ROUND_DELAY =
        0xa82bea7140872d1398fa0ab5075330ab0228f4c7e381b4b6502379ffc7cdcd9f;

    // ORACLE_PRICE_DIGITS = keccak256(MOC_ORACLE\1\ORACLE_PRICE_DIGITS)
    bytes32 public constant ORACLE_PRICE_DIGITS =
        0x4cd7e3f12ee4a2db0a6ba16e03fbc31bba1048c149bbf4fc9f3c02021ec550b8;

    // ORACLE_QUEUE_LEN = keccak256(MOC_ORACLE\1\ORACLE_QUEUE_LEN)
    bytes32 public constant ORACLE_QUEUE_LEN =
        0x7d32d87d65898c3cbc7e72c59d223bf61c7811e99dafafd24fb08e0a38f10914;

    // MESSAGE_VERSION = keccak256(MOC_ORACLE\1\MESSAGE_VERSION)
    bytes32 public constant MESSAGE_VERSION =
        0xeafac1a2b4d4fdcc942cbdce334a88ec83387087978d039f1320d3639a0b59df;

    // ORACLE_PRICE_DELTA_PCT = keccak256(MOC_ORACLE\1\ORACLE_PRICE_DELTA_PCT)
    bytes32 public constant ORACLE_PRICE_DELTA_PCT =
        0x41a2ac05b365409628009a8091d8dda06fe52fe2f1c792e651e5df7599a7a7de;

    // ORACLE_PRICE_PUBLISH_BLOCKS = keccak256(MOC_ORACLE\1\ORACLE_PRICE_PUBLISH_BLOCKS)
    bytes32 public constant ORACLE_PRICE_PUBLISH_BLOCKS =
        0x51a2be29a473202678b6cf57b717ba5d7ff671f01fdbdbfcad4e1882601b8896;

    // ORACLE_ENTERING_FALLBACKS_AMOUNTS = keccak256(MOC_ORACLE\1\ORACLE_ENTERING_FALLBACKS_AMOUNTS)
    bytes32 public constant ORACLE_ENTERING_FALLBACKS_AMOUNTS =
        0xf646c455329c7af0436f9e95c59c90ce0e11bb4e3a1deff805807798696adf88;

    // ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS = keccak256(MOC_ORACLE\1\ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS)
    bytes32 public constant ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS =
        0xef9006fe6663199909dfaa4ab45e3f86d6454adb7773682f356824b6b3bc6b0e;

    // ORACLE_MIN_ORACLES_PER_ROUND = keccak256(MOC_ORACLE\1\ORACLE_MIN_ORACLES_PER_ROUND)
    bytes32 public constant ORACLE_MIN_ORACLES_PER_ROUND =
        0xf5afc54dd2c3e35bfa15485ed117b621cf51f31f803d11be832ccde6c77a6b56;

    // MOC_FLOW_BUFFERS = keccak256(MOC_FLOW\1\BUFFERS)
    bytes32 public constant MOC_FLOW_BUFFERS =
        0x4cb845794d5472a713e41e8e4ddc566dab8d695f1dc6c8edd43dad9d55112a22;

    // MOC_FLOW_DRIPPERS = keccak256(MOC_FLOW\1\DRIPPERS)
    bytes32 public constant MOC_FLOW_DRIPPERS =
        0xdd6eacd9b2305faa48e6e500ef302cf28b8cd660dc843b355a6f5f26655eee73;

    // MOC_FLOW_COINERS = keccak256(MOC_FLOW\1\COINERS)
    bytes32 public constant MOC_FLOW_COINERS =
        0x8970fe7a53b9c3dfce4f2afec48b5a6550afcb16ea2da8a10ec4b47a83a34a9d;

    // MOC_FLOW_REVERSE_AUCTIONS = keccak256(MOC_FLOW\1\REVERSE_AUCTIONS)
    bytes32 public constant MOC_FLOW_REVERSE_AUCTIONS =
        0x0428ec087e0cce276a71d1caf1afe4da32a2d48b3ebe579040612b5bd262ff73;
}

library RegistryConstantsLib {
    function MOC_PROJECT_VERSION() internal pure returns (bytes32) {
        // keccak256(moc.project.version)
        return 0xc1c87e0508bb8270ee6a6dbe630baa072e6e3d5968981666724b9333430e1c31;
    }

    function MOC_TOKEN() internal pure returns (bytes32) {
        // keccak256(moc.token)
        return 0x4bd5e7ff929fdd1ba62a33f76e0f40e97bb35e8bf126c0d9d91ce5c69a4bc521;
    }

    function MOC_DELAY_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.delay-machine)
        return 0x66b60892ff6e7f0da16db27046f5960fdfd6bce5c3c8c21d56ccca3236a6281b;
    }

    function MOC_STAKING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.staking-machine)
        return 0x3c557531fea67120f21bc7711270a96f1b8cff3dfe3dd798a8a9f09ce9b77972;
    }

    function MOC_VESTING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.vesting-machine)
        return 0x7dfea4fb968e2599cdb7b3028c07d0188d0f92d1d00bd95c2805523c224649dd;
    }

    function MOC_VOTING_MACHINE() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine)
        return 0xc0ded27704f62d8726fdbd83648113d9fd8cf32c09f80523d2ba523e0bbd5ba4;
    }

    function MOC_UPGRADE_DELEGATOR() internal pure returns (bytes32) {
        // keccak256(moc.upgrade-delegator)
        return 0x631bcbb9b033f9c8d13c32cf6e60827348d77b91b58c295e87745219242cca22;
    }

    function MOC_PRICE_PROVIDER_REGISTRY() internal pure returns (bytes32) {
        // keccak256(moc.price-provider-registy)
        return 0xd4ed72d0bf9bae5e1e7ae31a372a37c8069168889284ec94be25b3f6707f5b4a;
    }

    function MOC_VOTING_MACHINE_MIN_STAKE() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.minStake)
        return 0x580be8e098dd1016787d59c2a534bf9df9ec679a29de4c8f92dc3807f7d7d54d;
    }

    function MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.preVoteExpirationTimeDelta)
        return 0x62f5dbf0c17b0df83487409f747ad2eeca5fd54c140ca59b32cf39d6f6eaf916;
    }

    function MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.maxPreProposals)
        return 0xc32b9cbc59039d297e670e7c196424308c90ba4a437fa7ccd008498c934e7dbf;
    }

    function MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.preVoteMinPCToWin)
        return 0x0a1b21dfd7e4f3741529cf579e2731e847d81bbf13a82d0eba6910d7ac4c1c0a;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctToVeto)
        return 0xfb2d33acd65c36f68a15f8fe41cb8c0dd1eda164ffa87c6882e685ccb1c1adfb;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctForQuorum)
        return 0xde1ede48948567c43c504b761af8cd6af5363fafeceb1239b3083955d809714f;
    }

    function MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.voteMinPctToAccept)
        return 0x99f83ee0c57b325f3deafb536d55596743ff112c6ac0d853d5f4f89b75dec045;
    }

    function MOC_VOTING_MACHINE_PCT_PRECISION() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.PCTPrecision)
        return 0x73ee596441ef88c207a7a9147d62f59186b4991555e37b7ce9c801f9539d1050;
    }

    function MOC_VOTING_MACHINE_VOTING_TIME_DELTA() internal pure returns (bytes32) {
        // keccak256(moc.voting-machine.votingTimeDelta)
        return 0xb43ee0a5ee6dcc7115ce824e4e353526ad6e479afa4daeb78451070de942de36;
    }

    function ORACLE_MANAGER_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MANAGER_ADDR)
        return 0x16986f74674f2ed21d50b6e74e6b12bb323ff4f72364542fd5de5104f3cc3ca9;
    }

    function SUPPORTERS_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SUPPORTERS_ADDR)
        return 0xe4f979504d2a7a24557a15195eb83131e7c4a66d33900454705435aa5a6ee086;
    }

    function INFO_ADDR() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\INFO_ADDR)
        return 0xda9f12e01fc92de345bb741448d36ecb967052dd7aa1670439af833c9a3d78f1;
    }

    function ORACLE_PRICE_FETCH_RATE() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_FETCH_RATE)
        return 0x945f72e5d44fb0ce3b1de393d19415723b79f97ad801089d8470d1c20e15ffef;
    }

    function ORACLE_BLOCKCHAIN_INFO_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_BLOCKCHAIN_INFO_INTERVAL)
        return 0x11cfbdf601b80a575e4366f0234cc06de0c9f401fe250dd9dccfccefeedb6fc2;
    }

    function ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL)
        return 0x2f271dc1fa81985bda14a2d6d0d60b45191d2a2d97e636b192696a8796d654a7;
    }

    function ORACLE_MAIN_LOOP_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MAIN_LOOP_TASK_INTERVAL)
        return 0x275d8a46b817572476d2d55b41c7709dee307740bad676a9693805003a48d231;
    }

    function ORACLE_PRICE_REJECT_DELTA_PCT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_REJECT_DELTA_PCT)
        return 0x7a3ee46ca1bd3e19089870d8d6530b083a86da93aab52efccb32d5950e2709cf;
    }

    function ORACLE_CONFIGURATION_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_CONFIGURATION_TASK_INTERVAL)
        return 0xb027f2006a45346de89db4c5efc53f4e05e96532d27366aff00367a394d0abc4;
    }

    function ORACLE_GATHER_SIGNATURE_TIMEOUT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_GATHER_SIGNATURE_TIMEOUT)
        return 0xf75b08b2b912abdbb87cc459ca0b4fdc019329386ec84ab68399b0c86fed5a95;
    }

    function ORACLE_MAIN_EXECUTOR_TASK_INTERVAL() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MAIN_EXECUTOR_TASK_INTERVAL)
        return 0xb324a91be1ac0d0c4888c835aee124ca1a7caf4b73ce10aa3504e2683865d7e5;
    }

    function SCHEDULER_POOL_DELAY() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SCHEDULER_POOL_DELAY)
        return 0x6c2abc911c0fa4c73b90c7143a9f4429749be45ebfe7b81e69b86e7ca440d811;
    }

    function SCHEDULER_ROUND_DELAY() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\SCHEDULER_ROUND_DELAY)
        return 0xa82bea7140872d1398fa0ab5075330ab0228f4c7e381b4b6502379ffc7cdcd9f;
    }

    function ORACLE_PRICE_DIGITS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_DIGITS)
        return 0x4cd7e3f12ee4a2db0a6ba16e03fbc31bba1048c149bbf4fc9f3c02021ec550b8;
    }

    function ORACLE_QUEUE_LEN() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_QUEUE_LEN)
        return 0x7d32d87d65898c3cbc7e72c59d223bf61c7811e99dafafd24fb08e0a38f10914;
    }

    function MESSAGE_VERSION() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\MESSAGE_VERSION)
        return 0xeafac1a2b4d4fdcc942cbdce334a88ec83387087978d039f1320d3639a0b59df;
    }

    function ORACLE_PRICE_DELTA_PCT() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_DELTA_PCT)
        return 0x41a2ac05b365409628009a8091d8dda06fe52fe2f1c792e651e5df7599a7a7de;
    }

    function ORACLE_PRICE_PUBLISH_BLOCKS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_PRICE_PUBLISH_BLOCKS)
        return 0x51a2be29a473202678b6cf57b717ba5d7ff671f01fdbdbfcad4e1882601b8896;
    }

    function ORACLE_ENTERING_FALLBACKS_AMOUNTS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_ENTERING_FALLBACKS_AMOUNTS)
        return 0xf646c455329c7af0436f9e95c59c90ce0e11bb4e3a1deff805807798696adf88;
    }

    function ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS)
        return 0xef9006fe6663199909dfaa4ab45e3f86d6454adb7773682f356824b6b3bc6b0e;
    }

    function ORACLE_MIN_ORACLES_PER_ROUND() internal pure returns (bytes32) {
        // keccak256(MOC_ORACLE\1\ORACLE_MIN_ORACLES_PER_ROUND)
        return 0xf5afc54dd2c3e35bfa15485ed117b621cf51f31f803d11be832ccde6c77a6b56;
    }

    function MOC_FLOW_BUFFERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\BUFFERS)
        return 0x4cb845794d5472a713e41e8e4ddc566dab8d695f1dc6c8edd43dad9d55112a22;
    }

    function MOC_FLOW_DRIPPERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\DRIPPERS)
        return 0xdd6eacd9b2305faa48e6e500ef302cf28b8cd660dc843b355a6f5f26655eee73;
    }

    function MOC_FLOW_COINERS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\COINERS)
        return 0x8970fe7a53b9c3dfce4f2afec48b5a6550afcb16ea2da8a10ec4b47a83a34a9d;
    }

    function MOC_FLOW_REVERSE_AUCTIONS() internal pure returns (bytes32) {
        // keccak256(MOC_FLOW\1\REVERSE_AUCTIONS)
        return 0x0428ec087e0cce276a71d1caf1afe4da32a2d48b3ebe579040612b5bd262ff73;
    }
}

/**
  @title MocRegistryInitChange
  @notice This contract is a ChangeContract intended to initialize all the MOC registry values
 */
contract MocRegistryInitChange is ChangeContract, RegistryConstants {
    IRegistry public registry;
    address public delayMachine;
    address public oracleManager;
    address public supporters;
    address public infoGetter;

    /**
      @notice Constructor
    */
    constructor(
        IRegistry _registry,
        address _delayMachine,
        address _oracleManager,
        address _supporters,
        address _infoGetter
    ) public {
        registry = _registry;
        delayMachine = _delayMachine;
        oracleManager = _oracleManager;
        supporters = _supporters;
        infoGetter = _infoGetter;
    }

    /**
      @notice Execute the changes.
      @dev Should be called by the governor, but this contract does not check that explicitly because it is
      not its responsability in the current architecture
     */
    function execute() external override {
        require(address(registry) != address(0), "Use once");

        registry.setAddress(MOC_DELAY_MACHINE, delayMachine);
        registry.setAddress(ORACLE_MANAGER_ADDR, oracleManager);
        registry.setAddress(SUPPORTERS_ADDR, supporters);
        registry.setAddress(INFO_ADDR, infoGetter);

        registry.setUint(ORACLE_PRICE_FETCH_RATE, 5);
        registry.setUint(ORACLE_BLOCKCHAIN_INFO_INTERVAL, 3);
        registry.setUint(ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL, 5);
        registry.setUint(ORACLE_MAIN_LOOP_TASK_INTERVAL, 120);
        registry.setDecimal(ORACLE_PRICE_REJECT_DELTA_PCT, 5, 1);
        registry.setUint(ORACLE_CONFIGURATION_TASK_INTERVAL, 240);
        registry.setUint(ORACLE_GATHER_SIGNATURE_TIMEOUT, 60);
        registry.setUint(ORACLE_MAIN_EXECUTOR_TASK_INTERVAL, 20);
        registry.setUint(SCHEDULER_POOL_DELAY, 1 * 60);
        registry.setUint(SCHEDULER_ROUND_DELAY, 30 * 60);
        registry.setUint(ORACLE_PRICE_DIGITS, 18);
        registry.setUint(ORACLE_QUEUE_LEN, 30);
        registry.setUint(MESSAGE_VERSION, 3);
        registry.setDecimal(ORACLE_PRICE_DELTA_PCT, 5, -2);
        registry.setUint(ORACLE_PRICE_PUBLISH_BLOCKS, 0);
        registry.setBytes(ORACLE_ENTERING_FALLBACKS_AMOUNTS, hex"020406080a");
        registry.setUint(ORACLE_TRIGGER_VALID_PUBLICATION_BLOCKS, 30);
        // usable just once!!!
        registry = IRegistry(0);
    }
}
