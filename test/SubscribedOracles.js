/* global artifacts, contract, it */
const {BN} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toChecksumAddress, randomHex, toBN, padLeft, numberToHex} = require('web3-utils');

const SubscribedOraclesMock = artifacts.require('SubscribedOraclesMock');

contract('SubscribedOracles', (accounts) => {
    const NUM_ORACLES = 50;
    const MAX_SUBSCRIBED_ORACLES = 30;
    const MAX_SELECTED_ORACLES = 10;
    const oracles = {};
    before(() => {
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            oracles[toChecksumAddress(randomHex(20))] = toBN(randomHex(1));
        }
    });
    let subscribedOracles;
    it('creation', async () => {
        subscribedOracles = await SubscribedOraclesMock.new(MAX_SUBSCRIBED_ORACLES);
        expect(subscribedOracles, 'Subscribed Oracles Test should be created').to.not.be.undefined;
        const length = await subscribedOracles.length();
        expect(length).to.be.bignumber.equal(new BN(0));
    });
    it('add', async () => {
        let res = Promise.resolve();
        for (const [oracle, stake] of Object.entries(oracles)) {
            res = res.then(() => subscribedOracles.addOrReplace(oracle, stake));
        }
        await res;
        expect(await subscribedOracles.length()).to.be.bignumber.equal(
            new BN(MAX_SUBSCRIBED_ORACLES),
        );
    });
    it('sort', async () => {
        let selected = await subscribedOracles.sort(MAX_SUBSCRIBED_ORACLES);
        expect(selected.length).to.equal(MAX_SUBSCRIBED_ORACLES);
        let stake = oracles[selected[0]];
        let i = 1;
        while (i < selected.length) {
            let next = oracles[selected[i]];
            expect(stake, 'Stake should be in decreasing order').to.be.bignumber.gte(next);
            next = stake;
            i += 1;
        }
        selected = await subscribedOracles.sort(new BN(MAX_SELECTED_ORACLES));
        expect(selected.length).to.equal(MAX_SELECTED_ORACLES);
        stake = oracles[selected[0]];
        i = 1;
        while (i < selected.length) {
            let next = oracles[selected[i]];
            expect(stake, 'Stake should be in decreasing order').to.be.bignumber.gte(next);
            next = stake;
            i += 1;
        }
    });
    it('sort - gas', async () => {
        const subscribed = await SubscribedOraclesMock.new(MAX_SUBSCRIBED_ORACLES);
        let res = Promise.resolve();
        for (const [oracle, stake] of Object.entries(oracles)) {
            res = res.then(() => subscribed.addOrReplace(oracle, stake));
        }
        await res;
        await subscribed.sortForGas(MAX_SELECTED_ORACLES);
    });
    it('remove', async () => {
        const length = await subscribedOracles.length();
        const selected = await subscribedOracles.sort(new BN(MAX_SELECTED_ORACLES));
        for (const oracle of selected) {
            await subscribedOracles.remove(oracle);
        }
        length.sub(new BN(selected.length));
        expect(await subscribedOracles.length()).to.be.bignumber.equal(
            length.sub(new BN(selected.length)),
        );
    });
    it('minimum', async () => {
        const subscribed = await SubscribedOraclesMock.new(5);
        let res = Promise.resolve();
        for (let i = 1; i <= 5; i += 1) {
            const oracle = toChecksumAddress(padLeft(numberToHex(i), 40));
            res = res.then(() => subscribed.addOrReplace(oracle, i));
        }
        await res;
        const {0: minStake, 1: minAddress} = await subscribed.getMin();
        expect(minStake).to.be.bignumber.equal(toBN(1));
        expect(minAddress).equal(toChecksumAddress(padLeft(numberToHex(1), 40)));
    });
    it('on withdraw', async () => {
        const subscribed = await SubscribedOraclesMock.new(MAX_SUBSCRIBED_ORACLES);
        let res = Promise.resolve();
        for (const [oracle, stake] of Object.entries(oracles)) {
            res = res.then(() => subscribed.addOrReplace(oracle, stake));
        }
        await res;
        await subscribed.selectOracles(MAX_SELECTED_ORACLES);
        const selected = await subscribed.getSelectedOracles();
        for (let i = 0; i < selected.length; i += 1) {
            await subscribed.onWithdraw(selected[i], i % 2 !== 0);
        }
    });
});
