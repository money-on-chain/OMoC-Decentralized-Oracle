import { expect } from 'chai';
import { randomBytes } from 'crypto';
import { network } from 'hardhat';
import { createGovernor, decodeCoinPair, encodeCoinPair } from './helpers.js';
import { ContractOf, Deployer, Viem, WalletClients } from 'ts-test-helpers';
import type { Address } from 'viem';

function randomAddress(): Address {
    return ('0x' + randomBytes(20).toString('hex')) as Address;
}

describe('CoinPairRegister', function () {
    let viem: Viem;
    let deployer: Deployer;
    let accounts: WalletClients;
    let coinPairRegister: {
        contract: ContractOf<'OracleManager'>;
        registerCoinPair: (coinPair: string, address: string) => Promise<unknown>;
    };
    let pairs: Array<{ coinPair: string; address: Address }>;

    before(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        pairs = [
            { coinPair: 'BTCUSD', address: randomAddress() },
            { coinPair: 'RIFBTC', address: randomAddress() },
        ];

        const governor = await createGovernor(deployer, accounts[8]);
        const oracleManager = await deployer.deployUninitializedProxy('OracleManager');
        const supporters = await deployer.deployUninitializedProxy('Supporters');
        const token = await deployer.deploy('GovernedERC20');

        await token.write.initialize([governor.address]);
        await supporters.write.initialize([
            governor.addr,
            [oracleManager.address],
            token.address,
            10n,
        ]);
        await oracleManager.write.initialize([
            governor.addr,
            10000n,
            supporters.address,
            [supporters.address, accounts[0].account!.address],
        ]);

        coinPairRegister = {
            contract: oracleManager,
            registerCoinPair: async (coinPair: string, address: string) => {
                return governor.registerCoinPair(oracleManager, coinPair, address);
            },
        };
    });

    it('must register BTCUSD coin pair', async function () {
        await coinPairRegister.registerCoinPair(
            encodeCoinPair(pairs[0].coinPair),
            pairs[0].address,
        );
    });

    it('must register BTCRIF coin pair', async function () {
        await coinPairRegister.registerCoinPair(
            encodeCoinPair(pairs[1].coinPair),
            pairs[1].address,
        );
    });

    it('must fail to register BTCRIF coin pair twice', async function () {
        await viem.assertions.revertWith(
            coinPairRegister.registerCoinPair(encodeCoinPair(pairs[1].coinPair), pairs[1].address),
            'Pair is already registered',
        );
    });

    it('must fail to register if called by non-governance account', async function () {
        await viem.assertions.revertWith(
            coinPairRegister.contract.write.registerCoinPair(
                [encodeCoinPair(pairs[1].coinPair), pairs[1].address],
                { account: accounts[2].account! },
            ),
            'not_authorized_changer',
        );
    });

    it('must fail to register coin pair with address zero', async function () {
        await viem.assertions.revertWith(
            coinPairRegister.registerCoinPair(
                encodeCoinPair('ZERO'),
                '0x0000000000000000000000000000000000000000',
            ),
            'Address cannot be zero',
        );
    });

    it('must retrieve the number of registered coin pairs', async function () {
        expect(await coinPairRegister.contract.read.getCoinPairCount()).to.equal(
            BigInt(pairs.length),
        );
    });

    it('must retrieve the correct coin pair at index', async function () {
        expect(
            decodeCoinPair(await coinPairRegister.contract.read.getCoinPairAtIndex([0n])),
        ).to.equal(pairs[0].coinPair);
        expect(
            decodeCoinPair(await coinPairRegister.contract.read.getCoinPairAtIndex([1n])),
        ).to.equal(pairs[1].coinPair);
    });

    it('must fail if out of bounds index', async function () {
        await viem.assertions.revertWith(
            coinPairRegister.contract.read.getCoinPairAtIndex([BigInt(pairs.length) + 10n]),
            'Illegal index',
        );
    });
});
