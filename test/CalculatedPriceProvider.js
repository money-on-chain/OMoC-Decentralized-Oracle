const helpers = require('./helpers');
const CalculatedPriceProvider = artifacts.require('CalculatedPriceProvider');
const MockIPriceProvider = artifacts.require('MockIPriceProvider');
const MockGovernor = artifacts.require('@moc/shared/MockGovernor');
const { expectRevert, BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { deployProxy, silenceWarnings } = require('@openzeppelin/truffle-upgrades');

contract('CalculatedPriceProvider', async (accounts) => {
    await silenceWarnings();

    const GOVERNOR = accounts[8];
    const lastPubBlockMin = web3.utils.toBN(213);
    const lastPubBlockMax = web3.utils.toBN(1213);

    async function constructCalculatedPriceProvider(
        multiplicator,
        multiplyBy,
        divisor,
        divideBy,
        whitelist = [],
    ) {
        const governor = await MockGovernor.new(GOVERNOR);
        //const ret = await CalculatedPriceProvider.new();
        //await ret.initialize(
        //    governor.address,
        //    whitelist,
        //    multiplicator,
        //    multiplyBy,
        //    divisor,
        //    divideBy,
        //);
        const ret = await deployProxy(
            CalculatedPriceProvider,
            [governor.address, whitelist, multiplicator, multiplyBy, divisor, divideBy],
            {
                /// Since I can't use this: /// @custom:oz-upgrades-unsafe-allow constructor
                /// in contracts because of the solidity version
                /// I must use { unsafeAllow: ['constructor', 'delegatecall'] } here!!!
                unsafeAllow: ['constructor', 'delegatecall'],
            },
        );

        return ret;
    }

    it('Check type', async () => {
        const CalculatedType = 2;
        const calculatedPriceProvider = await CalculatedPriceProvider.new();
        assert.equal(await calculatedPriceProvider.getPriceProviderType(), CalculatedType);
    });

    it('Check mock', async () => {
        const price = 123840389;
        let val;

        expect(lastPubBlockMin.lt(lastPubBlockMax), 'pubBlock').to.be.true;

        const mock1 = await MockIPriceProvider.new(price, true, lastPubBlockMin);
        val = await mock1.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(price));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(new BN(lastPubBlockMin));

        const mock2 = await MockIPriceProvider.new(price, false, lastPubBlockMax);
        val = await mock2.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(price));
        expect(val[1], 'valid').to.be.false;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(new BN(lastPubBlockMax));
    });

    it('Result can be zero', async () => {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(0, [], 1, []);
        const val = await calculatedPriceProvider.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(0));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(constants.MAX_UINT256);
    });

    it('Should fail to divide by zero', async () => {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(1, [], 0, []);
        const val = await calculatedPriceProvider.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(0));
        expect(val[1], 'valid').to.be.false;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(constants.MAX_UINT256);
    });

    it('Identity', async () => {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(1, [], 1, []);
        const val = await calculatedPriceProvider.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(1));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(constants.MAX_UINT256);
    });

    it('After multiply and divide by the same return 1', async () => {
        const mock1 = await MockIPriceProvider.new(321, true, 123);
        const calculatedPriceProvider = await constructCalculatedPriceProvider(
            123,
            [mock1.address],
            123,
            [mock1.address],
        );
        const val = await calculatedPriceProvider.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(1));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(web3.utils.toBN(123));
    });

    it('Should fail if any of the source providers fail', async () => {
        const success = await MockIPriceProvider.new(321, true, lastPubBlockMax);
        const fail = await MockIPriceProvider.new(444, false, lastPubBlockMin);

        let args;
        let val;

        args = [123, [success.address, fail.address], 123, [success.address]];
        val = await (
            await constructCalculatedPriceProvider(...args)
        ).getPriceInfo({
            from: helpers.ADDRESS_ONE,
        });
        expect(val[0], 'price').to.be.bignumber.equal(web3.utils.toBN(0));
        expect(val[1], 'valid').to.be.false;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);

        args = [123, [success.address], 123, [success.address, fail.address]];
        val = await (
            await constructCalculatedPriceProvider(...args)
        ).getPriceInfo({
            from: helpers.ADDRESS_ONE,
        });
        expect(val[0], 'price').to.be.bignumber.equal(web3.utils.toBN(0));
        expect(val[1], 'valid').to.be.false;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);

        args = [123, [success.address, fail.address], 123, [success.address, fail.address]];
        val = await (
            await constructCalculatedPriceProvider(...args)
        ).getPriceInfo({
            from: helpers.ADDRESS_ONE,
        });
        expect(val[0], 'price').to.be.bignumber.equal(web3.utils.toBN(0));
        expect(val[1], 'valid').to.be.false;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);
    }).timeout(5000); // Why timeout?

    it('Some calculation', async () => {
        const mock1 = await MockIPriceProvider.new(123, true, lastPubBlockMin);
        const mock2 = await MockIPriceProvider.new(321, true, lastPubBlockMax);
        const args = [456, [mock1.address, mock2.address], 789, [mock1.address]];
        const contract = await constructCalculatedPriceProvider(...args);

        const result = (456 * 123 * 321) / (789 * 123);

        const val = await contract.peek({ from: helpers.ADDRESS_ONE });
        expect(web3.utils.toBN(val[0]), 'price').to.be.bignumber.equal(new BN(result));
        expect(val[1], 'valid').to.be.true;

        const val2 = await contract.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val2[0], 'price').to.be.bignumber.equal(new BN(result));
        expect(val2[1], 'valid').to.be.true;
        expect(val2[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);

        expect(
            await contract.getPrice({ from: helpers.ADDRESS_ONE }),
            'price',
        ).to.be.bignumber.equal(val2[0]);
        expect(await contract.getIsValid({ from: helpers.ADDRESS_ONE }), 'valid').to.be.true;
        expect(
            await contract.getLastPublicationBlock({ from: helpers.ADDRESS_ONE }),
            'lastPubBlock',
        ).to.be.bignumber.equal(val2[2]);
    });

    it('Some calculation change lastPubBlock Order', async () => {
        const mock1 = await MockIPriceProvider.new(123, true, lastPubBlockMax);
        const mock2 = await MockIPriceProvider.new(321, true, lastPubBlockMin);
        const args = [456, [mock1.address, mock2.address], 789, [mock1.address]];
        const contract = await constructCalculatedPriceProvider(...args);

        const result = (456 * 123 * 321) / (789 * 123);
        const val = await contract.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(result));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);
    });

    it('lastPubBlock', async () => {
        const mocks = [];
        const cant = 5;
        for (let i = 1; i <= cant; i++) {
            mocks.push(
                await MockIPriceProvider.new(546, true, lastPubBlockMin.mul(web3.utils.toBN(i))),
            );
            mocks.unshift(
                await MockIPriceProvider.new(123, true, lastPubBlockMin.mul(web3.utils.toBN(i))),
            );
        }
        const addrs = mocks.map((x) => x.address);
        const args = [789, addrs, 423, addrs];
        const contract = await constructCalculatedPriceProvider(...args);

        const val = await contract.getPriceInfo({ from: helpers.ADDRESS_ONE });
        expect(val[0], 'price').to.be.bignumber.equal(new BN(789 / 423));
        expect(val[1], 'valid').to.be.true;
        expect(val[2], 'lastPubBlock').to.be.bignumber.equal(lastPubBlockMin);
    });

    it('Whitelist manipulation', async () => {
        const whitelist = [helpers.ADDRESS_ONE, accounts[1]];
        const calculatedPriceProvider = await constructCalculatedPriceProvider(
            1,
            [],
            1,
            [],
            whitelist,
        );

        const length = await calculatedPriceProvider.getWhiteListLen();
        expect(length).to.be.bignumber.equal(new BN(2));
        expect(await calculatedPriceProvider.getWhiteListAtIndex(0)).to.equal(whitelist[0]);
        expect(await calculatedPriceProvider.getWhiteListAtIndex(1)).to.equal(whitelist[1]);

        await expectRevert(calculatedPriceProvider.addToWhitelist(accounts[2]), 'Invalid changer');
        calculatedPriceProvider.addToWhitelist(accounts[2], { from: GOVERNOR });

        expect(await calculatedPriceProvider.getWhiteListLen()).to.be.bignumber.equal(new BN(3));

        await expectRevert(
            calculatedPriceProvider.removeFromWhitelist(accounts[1]),
            'Invalid changer',
        );
        await calculatedPriceProvider.removeFromWhitelist(accounts[1], { from: GOVERNOR });

        expect(await calculatedPriceProvider.getWhiteListLen()).to.be.bignumber.equal(new BN(2));
    });
});
