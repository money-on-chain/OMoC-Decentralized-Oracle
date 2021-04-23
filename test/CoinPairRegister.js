const {BN, expectRevert} = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');

contract('CoinPairRegister', (accounts) => {
    before(async () => {
        this.pairs = [
            {coinpair: 'BTCUSD', address: web3.utils.randomHex(20)},
            {coinpair: 'RIFBTC', address: web3.utils.randomHex(20)},
        ];

        const OracleManager = artifacts.require('OracleManager');
        const governor = await helpers.createGovernor(accounts[8]);
        const oracleManager = await OracleManager.new();
        const minOracleOwnerStake = '10000';
        const Supporters = artifacts.require('Supporters');
        const supporters = await Supporters.new();
        const TestMOC = artifacts.require('@money-on-chain/omoc-sc-shared/GovernedERC20');
        const token = await TestMOC.new();
        await supporters.initialize(
            governor.addr,
            [oracleManager.address],
            token.address,
            new BN(10), // period
        );

        await oracleManager.initialize(governor.addr, minOracleOwnerStake, supporters.address, [
            supporters.address,
            accounts[0],
        ]);
        this.coinPairRegister = {
            ...oracleManager,
            origRegisterCoinPair: oracleManager.registerCoinPair,
            registerCoinPair: async (coinPair, addr) =>
                governor.registerCoinPair(oracleManager, coinPair, addr),
        };
    });

    it('Must register BTCUSD coin pair', async () => {
        await this.coinPairRegister.registerCoinPair(
            web3.utils.asciiToHex(this.pairs[0].coinpair),
            this.pairs[0].address,
        );
    });

    it('Must register BTCRIF coin pair', async () => {
        await this.coinPairRegister.registerCoinPair(
            web3.utils.asciiToHex(this.pairs[1].coinpair),
            this.pairs[1].address,
        );
    });

    it('Must fail to register BTCRIF coin pair twice', async () => {
        await expectRevert(
            this.coinPairRegister.registerCoinPair(
                web3.utils.asciiToHex(this.pairs[1].coinpair),
                this.pairs[1].address,
            ),
            'Pair is already registered',
        );
    });

    it('Must fail to register if called by non-governance account', async () => {
        await expectRevert(
            this.coinPairRegister.origRegisterCoinPair(
                web3.utils.asciiToHex(this.pairs[1].coinpair),
                this.pairs[1].address,
                {from: accounts[2]},
            ),
            'not_authorized_changer',
        );
    });

    it('Must fail to register coin pair with address zero', async () => {
        await expectRevert(
            this.coinPairRegister.registerCoinPair(
                web3.utils.asciiToHex('ZERO'),
                '0x0000000000000000000000000000000000000000',
            ),
            'Address cannot be zero',
        );
    });

    it('Must retrieve the number of registered coin pairs', async () => {
        await assert.equal(await this.coinPairRegister.getCoinPairCount(), this.pairs.length);
    });

    it('Must retrieve the correct coin pair at index', async () => {
        await assert.equal(
            web3.utils.toAscii((await this.coinPairRegister.getCoinPairAtIndex(0)).substr(0, 14)),
            this.pairs[0].coinpair,
        );
        await assert.equal(
            web3.utils.toAscii((await this.coinPairRegister.getCoinPairAtIndex(1)).substr(0, 14)),
            this.pairs[1].coinpair,
        );
    });

    it('Must fail if out of bounds index', async () => {
        await expectRevert(
            this.coinPairRegister.getCoinPairAtIndex(this.pairs.length + 10),
            'Illegal index',
        );
    });
});
