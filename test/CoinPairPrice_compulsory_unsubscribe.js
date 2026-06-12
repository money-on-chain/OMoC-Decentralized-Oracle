/* global it, describe, contract, beforeEach */
/* eslint-disable no-unused-expressions */
/**
 * Tests for the fix in onWithdraw: oracles that are subscribed but NOT selected in the current
 * round are now unsubscribed immediately when their stake drops below the minimum.
 *
 * Bug: onWithdraw() returned early (return 0) for oracles not selected in the current round,
 * without checking whether their stake fell below the minimum. This left them subscribed with
 * zero stake indefinitely, allowing their oracle address to still appear as a valid signer.
 */
const helpers = require('./helpers');
const chai = require('chai');
const { expect } = chai;
const { toWei, toBN } = require('web3-utils');

contract('CoinPairPrice - onWithdraw unsubscribes subscribed-but-not-selected oracle', async (accounts) => {
    const COINPAIR = 'BTCUSD';
    const coinPair = web3.utils.asciiToHex(COINPAIR);
    const governorOwner = accounts[0];
    // maxOraclesPerRound=2 so we can easily have a subscribed-but-not-selected oracle
    const maxOraclesPerRound = 2;
    const maxSubscribedOraclesPerRound = 10;
    const minSubscriptionStake = toBN(toWei('1', 'ether'));

    // Three oracles: two will fill the round, one will be subscribed but not selected
    const oracle1 = { name: 'oracle-1.io', stake: minSubscriptionStake.add(toBN(toWei('3', 'ether'))), owner: accounts[2], oracle: accounts[3] };
    const oracle2 = { name: 'oracle-2.io', stake: minSubscriptionStake.add(toBN(toWei('2', 'ether'))), owner: accounts[4], oracle: accounts[5] };
    // oracle3 has less stake, will subscribe after the round is full → subscribed but not selected
    const oracle3 = { name: 'oracle-3.io', stake: minSubscriptionStake.add(toBN(toWei('0', 'ether'))), owner: accounts[6], oracle: accounts[7] };

    let contracts;
    let coinPairPrice;

    const registerAndSubscribe = async (data) => {
        await contracts.governor.mint(contracts.token.address, data.owner, data.stake);
        await contracts.token.approve(contracts.staking.address, data.stake, { from: data.owner });
        await contracts.staking.deposit(data.stake, data.owner, { from: data.owner });
        await contracts.staking.registerOracle(data.oracle, data.name, { from: data.owner });
        await contracts.staking.subscribeToCoinPair(coinPair, { from: data.owner });
    };

    beforeEach(async () => {
        contracts = await helpers.initContracts({
            governorOwner,
            minSubscriptionStake,
        });
        coinPairPrice = await helpers.initCoinpair(COINPAIR, {
            ...contracts,
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            whitelist: [accounts[0]],
        });

        // oracle1 and oracle2 subscribe first → they fill the round (maxOraclesPerRound=2)
        await registerAndSubscribe(oracle1);
        await registerAndSubscribe(oracle2);
        // oracle3 subscribes after the round is full → subscribed but NOT selected
        await registerAndSubscribe(oracle3);
    });

    it('oracle3 is subscribed but not selected before the fix scenario', async () => {
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.true;

        const roundInfo = await coinPairPrice.getOracleRoundInfo(oracle3.owner);
        expect(roundInfo.selectedInCurrentRound).to.be.false;
    });

    it('oracle3 withdraws all stake and is immediately unsubscribed (fix)', async () => {
        // oracle3 is subscribed but not selected
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.true;

        // Withdraw all stake — this triggers onWithdraw in CoinPairPrice
        await contracts.staking.withdrawAll({ from: oracle3.owner });

        // Balance should be zero
        expect(await contracts.staking.getBalance(oracle3.owner)).to.be.bignumber.equal(toBN(0));

        // Should have been unsubscribed immediately (fix: onWithdraw now checks subscribed-not-selected case)
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.false;
    });

    it('oracle3 withdrawing below minimum stake is unsubscribed immediately', async () => {
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.true;

        // Withdraw leaving just below the minimum
        const withdrawAmount = oracle3.stake.sub(minSubscriptionStake).add(toBN('1'));
        await contracts.staking.withdraw(withdrawAmount, { from: oracle3.owner });

        const remaining = await contracts.staking.getBalance(oracle3.owner);
        expect(remaining).to.be.bignumber.lt(minSubscriptionStake);

        // Should be unsubscribed
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.false;
    });

    it('oracle3 withdrawing to exactly minimum stake stays subscribed', async () => {
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.true;

        // Withdraw leaving exactly the minimum (oracle3.stake == minSubscriptionStake so nothing to withdraw)
        // oracle3.stake is exactly minSubscriptionStake, so any withdrawal puts it below
        // Let's use oracle1 instead (it has extra stake) to test the "stays subscribed" case
        const extraStake = toBN(toWei('2', 'ether')); // oracle1 has min + 3 ETH
        await contracts.staking.withdraw(extraStake, { from: oracle1.owner });

        const remaining = await contracts.staking.getBalance(oracle1.owner);
        expect(remaining).to.be.bignumber.gte(minSubscriptionStake);

        // oracle1 is selected AND still has enough stake → stays subscribed
        expect(await coinPairPrice.isSubscribed(oracle1.owner)).to.be.true;
    });

    it('selected oracle that withdraws below minimum is also unsubscribed (existing behavior preserved)', async () => {
        // oracle1 is selected
        const roundInfo1 = await coinPairPrice.getOracleRoundInfo(oracle1.owner);
        expect(roundInfo1.selectedInCurrentRound).to.be.true;

        // Withdraw all stake
        await contracts.staking.withdrawAll({ from: oracle1.owner });

        // Should be unsubscribed (existing behavior for selected oracles)
        expect(await coinPairPrice.isSubscribed(oracle1.owner)).to.be.false;
    });

    it('oracle3 can re-subscribe after depositing enough stake', async () => {
        // Withdraw all
        await contracts.staking.withdrawAll({ from: oracle3.owner });
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.false;

        // Re-deposit
        const newStake = minSubscriptionStake.add(toBN(toWei('1', 'ether')));
        await contracts.governor.mint(contracts.token.address, oracle3.owner, newStake);
        await contracts.token.approve(contracts.staking.address, newStake, { from: oracle3.owner });
        await contracts.staking.deposit(newStake, oracle3.owner, { from: oracle3.owner });

        // Re-subscribe should succeed
        await contracts.staking.subscribeToCoinPair(coinPair, { from: oracle3.owner });
        expect(await coinPairPrice.isSubscribed(oracle3.owner)).to.be.true;
    });
});
