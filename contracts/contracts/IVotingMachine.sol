pragma solidity ^0.6.0;

interface IVotingMachine {
    /**
    This method add a proposal to the pre-voting process.

    @param _proposal Address of the change contract that will be executed if this vote is successful
    */
    function createProposal(address _proposal) external;

    /**
    Pre Vote a proposal

    @param _proposal Address of the change contract that will be executed if this vote is successful
    */
    function preVote(address _proposal) external;

    /**
    Vote a proposal

    @param _inFavorAgainst Type of vote
    */
    function vote(bool _inFavorAgainst) external;

    /**
    There is a veto Condition

    */
    function vetoCondition() external;

    /**
    Veto
    */
    function veto() external;

    /**
    preVoteStep
    */
    function preVoteStep() external;

    /**
    voteStep
    */
    function voteStep() external;

    /**
    vetoStep
    */
    function vetoStep() external;

    /**
    acceptedStep
    */
    function acceptedStep() external;

    /**
    Unregister a proposal, free the assets it uses.

    @param _proposal Address of the change contract that will be executed if this vote is successful
    */
    function unregister(address _proposal) external;
}
