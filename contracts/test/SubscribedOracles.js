/* global artifacts, beforeEach, contract, it */
const {BN} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toChecksumAddress, randomHex, toBN} = require('web3-utils');

const TestSubscribedOracles = artifacts.require('TestSubscribedOracles');

contract('SubscribedOracles', (accounts) => {
    const NUM_ORACLES = 10;
    const oracles = {};
    before(() => {
        for (let i = 0; i < NUM_ORACLES; i += 1) {
            oracles[toChecksumAddress(randomHex(20))] = toBN(randomHex(1));
        }
    });
    let subscribedOracles;
    it('creation', async () => {
        subscribedOracles = await TestSubscribedOracles.new();
        expect(subscribedOracles, 'Subscribed Oracles Test should be created').to.not.be.undefined;
    });
    it('add', async () => {
        let res = Promise.resolve();
        for (const [oracle, stake] of Object.entries(oracles)) {
            res = res.then(() => subscribedOracles.add(oracle, stake));
        }
        await res;
        expect(await subscribedOracles.length()).to.be.bignumber.equal(new BN(NUM_ORACLES));
    });
    it('sort - all', async () => {
        const length = await subscribedOracles.length();
        const selected = await subscribedOracles.sort(length);
        console.log(selected);
        let stake = oracles[selected[0]];
        let i = 1;
        while (i < selected.length) {
            let next = oracles[selected[i]];
            expect(stake, 'Stake should be in decreasing order').to.be.bignumber.gte(next);
            next = stake;
            i += 1;
        }
    });
    it('sort - half', async () => {
        const length = await subscribedOracles.length();
        const selected = await subscribedOracles.sort(length.div(toBN(2)));
        let stake = oracles[selected[0]];
        let i = 1;
        while (i < selected.length) {
            let next = oracles[selected[i]];
            expect(stake, 'Stake should be in decreasing order').to.be.bignumber.gte(next);
            next = stake;
            i += 1;
        }
    });
    it('remove', async () => {
        const entries = Object.entries(oracles);
        await subscribedOracles.remove(entries[0][0]);
        await subscribedOracles.remove(entries[entries.length - 1][0]);
        expect(await subscribedOracles.length()).to.be.bignumber.equal(new BN(NUM_ORACLES - 2));
    });
});
