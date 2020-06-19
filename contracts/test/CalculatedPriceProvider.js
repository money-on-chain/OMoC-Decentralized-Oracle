const helpers = require('./helpers');
const CalculatedPriceProvider = artifacts.require("CalculatedPriceProvider");
const MockIPriceProvider = artifacts.require("MockIPriceProvider");
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers')
const {expect} = require("chai")
const ethers = require('ethers');

contract("CalculatedPriceProvider", async (accounts) => {
    it("Check type", async () => {
        const CalculatedType = 2;
        const calculatedPriceProvider = await CalculatedPriceProvider.new(1, [], 1, []);
        assert.equal(await calculatedPriceProvider.getPriceProviderType(), CalculatedType);
    });

    it("Check mock", async () => {
        const price = 123840389;
        let val;

        const mock1 = await MockIPriceProvider.new(price, true);
        val = await mock1.peek();
        expect(val[1], "valid").to.be.true;
        expect(web3.utils.toBN(val[0]), "price").to.be.bignumber.equal(new BN(price));

        const mock2 = await MockIPriceProvider.new(price, false);
        val = await mock2.peek();
        expect(val[1], "valid").to.be.false;
    });

    it("Result can be zero", async () => {
        const price = 0;
        const calculatedPriceProvider = await CalculatedPriceProvider.new(0, [], 1, []);
        const val = await calculatedPriceProvider.peek();
        expect(val[1], "valid").to.be.true;
        expect(web3.utils.toBN(val[0]), "price").to.be.bignumber.equal(new BN(0));
    });

    it("Should fail to divide by zero", async () => {
        const price = 0;
        const calculatedPriceProvider = await CalculatedPriceProvider.new(1, [], 0, []);
        const val = await calculatedPriceProvider.peek();
        expect(val[1], "valid").to.be.false;
    });

    it("After multiply and divide by the same return 1", async () => {
        const mock1 = await MockIPriceProvider.new(321, true);
        const calculatedPriceProvider = await CalculatedPriceProvider.new(123, [mock1.address], 123, [mock1.address]);
        const val = await calculatedPriceProvider.peek();
        expect(val[1], "valid").to.be.true;
        expect(web3.utils.toBN(val[0]), "price").to.be.bignumber.equal(new BN(1));
    });

    it("Should fail if any of the source providers fail", async () => {
        const success = await MockIPriceProvider.new(321, true);
        const fail = await MockIPriceProvider.new(444, false);

        let args;
        let val;

        args = [123, [success.address, fail.address], 123, [success.address]];
        val = await (await CalculatedPriceProvider.new(...args)).peek();
        expect(val[1], "valid").to.be.false;

        args = [123, [success.address], 123, [success.address, fail.address]];
        val = await (await CalculatedPriceProvider.new(...args)).peek();
        expect(val[1], "valid").to.be.false;

        args = [123, [success.address, fail.address], 123, [success.address, fail.address]];
        val = await (await CalculatedPriceProvider.new(...args)).peek();
        expect(val[1], "valid").to.be.false;
    });

    it("Some calculation", async () => {
        const mock1 = await MockIPriceProvider.new(123, true);
        const mock2 = await MockIPriceProvider.new(321, true);

        let args;
        let val;

        args = [456, [mock1.address, mock2.address], 789, [mock1.address]];
        val = await (await CalculatedPriceProvider.new(...args)).peek();
        expect(val[1], "valid").to.be.true;
        const result = (456 * 123 * 321) / (789 * 123);
        // new BN round the result.
        expect(web3.utils.toBN(val[0]), "price").to.be.bignumber.equal(new BN(result));
    });

})