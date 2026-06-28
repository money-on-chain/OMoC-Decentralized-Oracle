import { expect } from 'chai';
import { network } from 'hardhat';
import { ADDRESS_ONE, MAX_UINT256 } from './helpers.js';
import { assertSameAddress, ContractOf, Deployer, Viem, WalletClients } from 'ts-test-helpers';
import type { Address } from 'viem';

describe('CalculatedPriceProvider', function () {
    let viem: Viem;
    let deployer: Deployer;
    let accounts: WalletClients;

    async function constructCalculatedPriceProvider(
        multiplicator: bigint,
        multiplyBy: Address[],
        divisor: bigint,
        divideBy: Address[],
        whitelist: Address[] = [],
    ): Promise<ContractOf<'CalculatedPriceProvider'>> {
        const governor = await deployer.deploy('MockGovernor', [accounts[8].account!.address]);

        return deployer.deployProxy('CalculatedPriceProvider', [
            governor.address,
            whitelist,
            multiplicator,
            multiplyBy,
            divisor,
            divideBy,
        ]);
    }

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    it('check type', async function () {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(1n, [], 1n, []);
        expect(await calculatedPriceProvider.read.getPriceProviderType()).to.equal(2);
    });

    it('check mock', async function () {
        const price = 123840389n;
        const lastPubBlockMin = 213n;
        const lastPubBlockMax = 1213n;

        const mock1 = await deployer.deploy('MockIPriceProvider', [price, true, lastPubBlockMin]);
        let val = await mock1.read.getPriceInfo();
        expect(val[0]).to.equal(price);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(lastPubBlockMin);

        const mock2 = await deployer.deploy('MockIPriceProvider', [price, false, lastPubBlockMax]);
        val = await mock2.read.getPriceInfo();
        expect(val[0]).to.equal(price);
        expect(val[1]).to.equal(false);
        expect(val[2]).to.equal(lastPubBlockMax);
    });

    it('result can be zero', async function () {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(0n, [], 1n, []);
        const val = await calculatedPriceProvider.read.getPriceInfo();
        expect(val[0]).to.equal(0n);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(MAX_UINT256);
    });

    it('should fail to divide by zero', async function () {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(1n, [], 0n, []);
        const val = await calculatedPriceProvider.read.getPriceInfo();
        expect(val[0]).to.equal(0n);
        expect(val[1]).to.equal(false);
        expect(val[2]).to.equal(MAX_UINT256);
    });

    it('identity', async function () {
        const calculatedPriceProvider = await constructCalculatedPriceProvider(1n, [], 1n, []);
        const val = await calculatedPriceProvider.read.getPriceInfo();
        expect(val[0]).to.equal(1n);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(MAX_UINT256);
    });

    it('after multiply and divide by the same return 1', async function () {
        const mock1 = await deployer.deploy('MockIPriceProvider', [321n, true, 123n]);
        const calculatedPriceProvider = await constructCalculatedPriceProvider(
            123n,
            [mock1.address],
            123n,
            [mock1.address],
        );
        const val = await calculatedPriceProvider.read.getPriceInfo();
        expect(val[0]).to.equal(1n);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(123n);
    });

    it('should fail if any of the source providers fail', async function () {
        const success = await deployer.deploy('MockIPriceProvider', [321n, true, 1213n]);
        const fail = await deployer.deploy('MockIPriceProvider', [444n, false, 213n]);

        let val = await (
            await constructCalculatedPriceProvider(123n, [success.address, fail.address], 123n, [
                success.address,
            ])
        ).read.getPriceInfo();
        expect(val[0]).to.equal(0n);
        expect(val[1]).to.equal(false);
        expect(val[2]).to.equal(213n);

        val = await (
            await constructCalculatedPriceProvider(123n, [success.address], 123n, [
                success.address,
                fail.address,
            ])
        ).read.getPriceInfo();
        expect(val[0]).to.equal(0n);
        expect(val[1]).to.equal(false);
        expect(val[2]).to.equal(213n);

        val = await (
            await constructCalculatedPriceProvider(123n, [success.address, fail.address], 123n, [
                success.address,
                fail.address,
            ])
        ).read.getPriceInfo();
        expect(val[0]).to.equal(0n);
        expect(val[1]).to.equal(false);
        expect(val[2]).to.equal(213n);
    });

    it('some calculation', async function () {
        const mock1 = await deployer.deploy('MockIPriceProvider', [123n, true, 213n]);
        const mock2 = await deployer.deploy('MockIPriceProvider', [321n, true, 1213n]);
        const contract = await constructCalculatedPriceProvider(
            456n,
            [mock1.address, mock2.address],
            789n,
            [mock1.address],
            [accounts[0].account!.address],
        );

        const result = (456n * 123n * 321n) / (789n * 123n);

        const peek = await contract.read.peek();
        expect(BigInt(peek[0])).to.equal(result);
        expect(peek[1]).to.equal(true);

        const info = await contract.read.getPriceInfo();
        expect(info[0]).to.equal(result);
        expect(info[1]).to.equal(true);
        expect(info[2]).to.equal(213n);
        expect(await contract.read.getPrice()).to.equal(info[0]);
        expect(await contract.read.getIsValid()).to.equal(true);
        expect(await contract.read.getLastPublicationBlock()).to.equal(info[2]);
    });

    it('some calculation change lastPubBlock order', async function () {
        const mock1 = await deployer.deploy('MockIPriceProvider', [123n, true, 1213n]);
        const mock2 = await deployer.deploy('MockIPriceProvider', [321n, true, 213n]);
        const contract = await constructCalculatedPriceProvider(
            456n,
            [mock1.address, mock2.address],
            789n,
            [mock1.address],
            [accounts[0].account!.address],
        );

        const result = (456n * 123n * 321n) / (789n * 123n);
        const val = await contract.read.getPriceInfo();
        expect(val[0]).to.equal(result);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(213n);
    });

    it('lastPubBlock', async function () {
        const mocks: Address[] = [];
        const lastPubBlockMin = 213n;

        for (let i = 1n; i <= 5n; i += 1n) {
            mocks.push(
                (await deployer.deploy('MockIPriceProvider', [546n, true, lastPubBlockMin * i]))
                    .address,
            );
            mocks.unshift(
                (await deployer.deploy('MockIPriceProvider', [123n, true, lastPubBlockMin * i]))
                    .address,
            );
        }

        const contract = await constructCalculatedPriceProvider(789n, mocks, 423n, mocks);
        const val = await contract.read.getPriceInfo();
        expect(val[0]).to.equal(789n / 423n);
        expect(val[1]).to.equal(true);
        expect(val[2]).to.equal(lastPubBlockMin);
    });

    it('whitelist manipulation', async function () {
        const whitelist: Address[] = [ADDRESS_ONE, accounts[1].account!.address];
        const calculatedPriceProvider = await constructCalculatedPriceProvider(
            1n,
            [],
            1n,
            [],
            whitelist,
        );

        expect(await calculatedPriceProvider.read.getWhiteListLen()).to.equal(2n);

        assertSameAddress(
            await calculatedPriceProvider.read.getWhiteListAtIndex([0n]),
            whitelist[0],
        );
        assertSameAddress(
            await calculatedPriceProvider.read.getWhiteListAtIndex([1n]),
            whitelist[1],
        );

        await viem.assertions.revertWith(
            calculatedPriceProvider.write.addToWhitelist([accounts[2].account!.address]),
            'Invalid changer',
        );
        await calculatedPriceProvider.write.addToWhitelist([accounts[2].account!.address], {
            account: accounts[8].account!,
        });
        expect(await calculatedPriceProvider.read.getWhiteListLen()).to.equal(3n);

        await viem.assertions.revertWith(
            calculatedPriceProvider.write.removeFromWhitelist([accounts[1].account!.address]),
            'Invalid changer',
        );
        await calculatedPriceProvider.write.removeFromWhitelist([accounts[1].account!.address], {
            account: accounts[8].account!,
        });
        expect(await calculatedPriceProvider.read.getWhiteListLen()).to.equal(2n);
    });
});
