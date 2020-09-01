const PriceProviderRegister = artifacts.require('PriceProviderRegister');
const MockGovernor = artifacts.require('@moc/shared/MockGovernor');
const {BN, expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const helpers = require('./helpers');

contract('PriceProviderRegister', (accounts) => {
    beforeEach(async () => {
        this.priceProviderRegister = await PriceProviderRegister.new();
        // a governor that let me do direct calls.
        const mockGovernor = await MockGovernor.new(accounts[0]);
        await this.priceProviderRegister.initialize(mockGovernor.address);
    });

    it('Should fail to register address zero', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await expectRevert(
            this.priceProviderRegister.registerCoinPair(coin_pair, constants.ZERO_ADDRESS, {
                from: accounts[0],
            }),
            'Address cannot be zero',
        );
    });

    it('Should fail to register the same coin pair twice', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        await expectRevert(
            this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
                from: accounts[0],
            }),
            'This coin pair is already registered',
        );
    });

    it("Should fail to unregister a coin pair that wasn't registered", async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        await expectRevert(
            this.priceProviderRegister.unRegisterCoinPair(web3.utils.asciiToHex('TEST1'), 0, {
                from: accounts[0],
            }),
            'This coin pair is already unregistered',
        );
    });

    it('Should fail to unregister a coin pair with invalid hint', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        await expectRevert(
            this.priceProviderRegister.unRegisterCoinPair(coin_pair, 100, {from: accounts[0]}),
            'Illegal index',
        );
    });

    it('Should fail to get and invalid index', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        await expectRevert(this.priceProviderRegister.getCoinPairAtIndex(100), 'Illegal index');
    });

    it('Should be able to unregister a coin pair', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        expect(await this.priceProviderRegister.getCoinPairCount()).to.be.bignumber.equal(
            new BN(1),
        );
        await this.priceProviderRegister.unRegisterCoinPair(coin_pair, 0, {from: accounts[0]});
        expect(await this.priceProviderRegister.getCoinPairCount()).to.be.bignumber.equal(
            new BN(0),
        );
    });

    it('Should be able to register/unregister a some coinpairs', async () => {
        const cant = 10;
        for (let i = 1; i < cant; i++) {
            const coin_pair = web3.utils.asciiToHex('TEST' + i);
            await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[i], {
                from: accounts[0],
            });

            expect(await this.priceProviderRegister.getCoinPairCount()).to.be.bignumber.equal(
                new BN(i),
            );
            expect(await this.priceProviderRegister.getContractAddress(coin_pair)).to.equal(
                accounts[i],
            );

            expect(await this.priceProviderRegister.getCoinPairAtIndex(i - 1)).to.equal(
                coin_pair.padEnd(66, '0'),
            );
            expect(
                await this.priceProviderRegister.getCoinPairIndex(coin_pair, 0),
            ).to.be.bignumber.equal(new BN(i - 1));
        }
        expect(await this.priceProviderRegister.getCoinPairCount()).to.be.bignumber.equal(
            new BN(cant - 1),
        );
        await this.priceProviderRegister.unRegisterCoinPair(web3.utils.asciiToHex('TEST4'), 2, {
            from: accounts[0],
        });
        await this.priceProviderRegister.unRegisterCoinPair(web3.utils.asciiToHex('TEST2'), 1, {
            from: accounts[0],
        });
        expect(await this.priceProviderRegister.getCoinPairCount()).to.be.bignumber.equal(
            new BN(cant - 3),
        );
        expect(await this.priceProviderRegister.getCoinPairAtIndex(0)).to.equal(
            web3.utils.asciiToHex('TEST1').padEnd(66, '0'),
        );
        expect(await this.priceProviderRegister.getCoinPairAtIndex(1)).to.equal(
            web3.utils.asciiToHex('TEST' + (cant - 2)).padEnd(66, '0'),
        );
        expect(await this.priceProviderRegister.getCoinPairAtIndex(2)).to.equal(
            web3.utils.asciiToHex('TEST3').padEnd(66, '0'),
        );
        expect(await this.priceProviderRegister.getCoinPairAtIndex(3)).to.equal(
            web3.utils.asciiToHex('TEST' + (cant - 1)).padEnd(66, '0'),
        );
        expect(await this.priceProviderRegister.getCoinPairAtIndex(4)).to.equal(
            web3.utils.asciiToHex('TEST5').padEnd(66, '0'),
        );
    });

    it('Should fail to set a coin pair address zero', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await expectRevert(
            this.priceProviderRegister.setCoinPair(coin_pair, constants.ZERO_ADDRESS, {
                from: accounts[0],
            }),
            'Address cannot be zero',
        );
    });

    it('Should fail to set an unregistered coin pair', async () => {
        const coin_pair = web3.utils.asciiToHex('TESTX');
        await expectRevert(
            this.priceProviderRegister.setCoinPair(coin_pair, accounts[1], {from: accounts[0]}),
            'This coin pair is not registered',
        );
    });

    it('Should be able to set a coin pair', async () => {
        const coin_pair = web3.utils.asciiToHex('TEST');
        await this.priceProviderRegister.registerCoinPair(coin_pair, accounts[1], {
            from: accounts[0],
        });
        expect(await this.priceProviderRegister.getContractAddress(coin_pair)).to.equal(
            accounts[1],
        );
        await this.priceProviderRegister.setCoinPair(coin_pair, accounts[2], {from: accounts[0]});
        expect(await this.priceProviderRegister.getContractAddress(coin_pair)).to.equal(
            accounts[2],
        );
    });
});
