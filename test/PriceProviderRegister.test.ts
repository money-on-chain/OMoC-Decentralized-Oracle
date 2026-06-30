import { expect } from 'chai';
import { network } from 'hardhat';
import { ADDRESS_ZERO, encodeCoinPair } from './helpers.js';
import { assertSameAddress, Deployer, Viem } from 'ts-test-helpers';

describe('PriceProviderRegister', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: Awaited<ReturnType<Viem['getWalletClients']>>;
    let priceProviderRegister: any;

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        priceProviderRegister = await deployer.deployUninitializedProxy('PriceProviderRegister');
        const mockGovernor = await deployer.deploy('MockGovernor', [accounts[0].account!.address]);
        await priceProviderRegister.write.initialize([mockGovernor.address], {
            account: accounts[0].account!,
        });
    });

    it('should fail to register address zero', async function () {
        await viem.assertions.revertWith(
            priceProviderRegister.write.registerCoinPair([encodeCoinPair('TEST'), ADDRESS_ZERO], {
                account: accounts[0].account!,
            }),
            'Address cannot be zero',
        );
    });

    it('should fail to register the same coin pair twice', async function () {
        const coinPair = encodeCoinPair('TEST');
        await priceProviderRegister.write.registerCoinPair(
            [coinPair, accounts[1].account!.address],
            {
                account: accounts[0].account!,
            },
        );
        await viem.assertions.revertWith(
            priceProviderRegister.write.registerCoinPair([coinPair, accounts[1].account!.address], {
                account: accounts[0].account!,
            }),
            'Pair is already registered',
        );
    });

    it("should fail to unregister a coin pair that wasn't registered", async function () {
        await priceProviderRegister.write.registerCoinPair(
            [encodeCoinPair('TEST'), accounts[1].account!.address],
            { account: accounts[0].account! },
        );
        await viem.assertions.revertWith(
            priceProviderRegister.write.unRegisterCoinPair([encodeCoinPair('TEST1'), 0n], {
                account: accounts[0].account!,
            }),
            'Pair is already unregistered',
        );
    });

    it('should fail to unregister a coin pair with invalid hint', async function () {
        const coinPair = encodeCoinPair('TEST');
        await priceProviderRegister.write.registerCoinPair(
            [coinPair, accounts[1].account!.address],
            {
                account: accounts[0].account!,
            },
        );
        await viem.assertions.revertWith(
            priceProviderRegister.write.unRegisterCoinPair([coinPair, 100n], {
                account: accounts[0].account!,
            }),
            'Illegal index',
        );
    });

    it('should fail to get an invalid index', async function () {
        await priceProviderRegister.write.registerCoinPair(
            [encodeCoinPair('TEST'), accounts[1].account!.address],
            { account: accounts[0].account! },
        );
        await viem.assertions.revertWith(
            priceProviderRegister.read.getCoinPairAtIndex([100n]),
            'Illegal index',
        );
    });

    it('should be able to unregister a coin pair', async function () {
        const coinPair = encodeCoinPair('TEST');
        await priceProviderRegister.write.registerCoinPair(
            [coinPair, accounts[1].account!.address],
            {
                account: accounts[0].account!,
            },
        );
        expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(1n);
        await priceProviderRegister.write.unRegisterCoinPair([coinPair, 0n], {
            account: accounts[0].account!,
        });
        expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(0n);
    });

    it('should be able to register/unregister some coinpairs', async function () {
        const count = 10;

        for (let i = 1; i < count; i += 1) {
            const coinPair = encodeCoinPair(`TEST${i}`);
            await priceProviderRegister.write.registerCoinPair(
                [coinPair, accounts[i].account!.address],
                {
                    account: accounts[0].account!,
                },
            );

            expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(BigInt(i));
            assertSameAddress(
                await priceProviderRegister.read.getContractAddress([coinPair]),
                accounts[i].account!.address,
            );
            expect(await priceProviderRegister.read.getCoinPairAtIndex([BigInt(i - 1)])).to.equal(
                coinPair,
            );
            expect(await priceProviderRegister.read.getCoinPairIndex([coinPair, 0n])).to.equal(
                BigInt(i - 1),
            );
        }

        expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(7n + 2n);

        await priceProviderRegister.write.unRegisterCoinPair([encodeCoinPair('TEST4'), 2n], {
            account: accounts[0].account!,
        });
        await priceProviderRegister.write.unRegisterCoinPair([encodeCoinPair('TEST2'), 1n], {
            account: accounts[0].account!,
        });

        expect(await priceProviderRegister.read.getCoinPairCount()).to.equal(7n);
        expect(await priceProviderRegister.read.getCoinPairAtIndex([0n])).to.equal(
            encodeCoinPair('TEST1'),
        );
        expect(await priceProviderRegister.read.getCoinPairAtIndex([1n])).to.equal(
            encodeCoinPair('TEST8'),
        );
        expect(await priceProviderRegister.read.getCoinPairAtIndex([2n])).to.equal(
            encodeCoinPair('TEST3'),
        );
        expect(await priceProviderRegister.read.getCoinPairAtIndex([3n])).to.equal(
            encodeCoinPair('TEST9'),
        );
        expect(await priceProviderRegister.read.getCoinPairAtIndex([4n])).to.equal(
            encodeCoinPair('TEST5'),
        );
    });

    it('should fail to set a coin pair address zero', async function () {
        await viem.assertions.revertWith(
            priceProviderRegister.write.setCoinPair([encodeCoinPair('TEST'), ADDRESS_ZERO], {
                account: accounts[0].account!,
            }),
            'Address cannot be zero',
        );
    });

    it('should fail to set an unregistered coin pair', async function () {
        await viem.assertions.revertWith(
            priceProviderRegister.write.setCoinPair(
                [encodeCoinPair('TESTX'), accounts[1].account!.address],
                {
                    account: accounts[0].account!,
                },
            ),
            'This coin pair is not registered',
        );
    });

    it('should be able to set a coin pair', async function () {
        const coinPair = encodeCoinPair('TEST');
        await priceProviderRegister.write.registerCoinPair(
            [coinPair, accounts[1].account!.address],
            {
                account: accounts[0].account!,
            },
        );

        assertSameAddress(
            await priceProviderRegister.read.getContractAddress([coinPair]),
            accounts[1].account!.address,
        );
        await priceProviderRegister.write.setCoinPair([coinPair, accounts[2].account!.address], {
            account: accounts[0].account!,
        });
        assertSameAddress(
            await priceProviderRegister.read.getContractAddress([coinPair]),
            accounts[2].account!.address,
        );
    });
});
