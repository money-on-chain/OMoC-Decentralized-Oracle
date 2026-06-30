import { expect } from 'chai';
import { network } from 'hardhat';
import { parseSignature, type Address } from 'viem';
import { getDefaultEncodedMessage, initCoinpair, initContracts } from './helpers.js';
import { Deployer, type ContractOf, type WalletClient } from 'ts-test-helpers';

const testsToRun = [
    {
        oracles: 1,
        tests: [{ signatures: 0, success: true }],
    },
    {
        oracles: 2,
        tests: [{ signatures: 0 }, { signatures: 1, success: true }],
    },
    {
        oracles: 3,
        tests: [
            { signatures: 0 },
            { signatures: 1, success: true },
            { signatures: 2, success: true },
        ],
    },
    {
        oracles: 4,
        tests: [
            { signatures: 0 },
            { signatures: 1 },
            { signatures: 2, success: true },
            { signatures: 3, success: true },
        ],
    },
    {
        oracles: 5,
        tests: [
            { signatures: 0 },
            { signatures: 1 },
            { signatures: 2, success: true },
            { signatures: 3, success: true },
            { signatures: 4, success: true },
        ],
    },
    {
        oracles: 6,
        tests: [
            { signatures: 0 },
            { signatures: 1 },
            { signatures: 2 },
            { signatures: 3, success: true },
            { signatures: 4, success: true },
            { signatures: 5, success: true },
        ],
    },
    {
        oracles: 7,
        tests: [
            { signatures: 0 },
            { signatures: 1 },
            { signatures: 2 },
            { signatures: 3, success: true },
            { signatures: 4, success: true },
            { signatures: 5, success: true },
            { signatures: 6, success: true },
        ],
    },
    {
        oracles: 8,
        tests: [
            { signatures: 0 },
            { signatures: 1 },
            { signatures: 2 },
            { signatures: 3 },
            { signatures: 4, success: true },
            { signatures: 5, success: true },
            { signatures: 6, success: true },
            { signatures: 7, success: true },
        ],
    },
] as const;

type OracleData = {
    name: string;
    stake: bigint;
    account: WalletClient;
    owner: WalletClient;
    address: Address;
};

describe('CoinPairPrice Signature', function () {
    async function setup(cantOracles: number) {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const contracts = await initContracts(deployer, accounts[0], 10n);
        const coinPairPrice = await initCoinpair(
            deployer,
            'BTCUSD',
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        const oracleData = accounts
            .slice(1, 10)
            .map((account, idx) => ({
                name: `oracle-${account.account!.address}.io`,
                stake: 4n * 10n ** 18n,
                account,
                owner: accounts[idx],
                address: account.account!.address,
            }))
            .sort((left, right) => {
                const a = BigInt(left.address);
                const b = BigInt(right.address);
                return a < b ? -1 : a > b ? 1 : 0;
            });

        await register(contracts, coinPairPrice, oracleData, cantOracles);

        return { viem, coinPairPrice, oracleData };
    }

    async function register(
        contracts: Awaited<ReturnType<typeof initContracts>>,
        coinPairPrice: ContractOf<'CoinPairPrice'>,
        oracleData: OracleData[],
        cantOracles: number,
    ) {
        const thisCoinPair = await coinPairPrice.read.getCoinPair();

        for (const oracle of oracleData.slice(0, cantOracles)) {
            await contracts.governor.mint(
                contracts.token.address,
                oracle.owner.account!.address,
                800000000000000000000n,
            );
            await contracts.token.write.approve([contracts.staking.address, oracle.stake], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.registerOracle([oracle.address, oracle.name], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.deposit([oracle.stake, oracle.owner.account!.address], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.subscribeToCoinPair([thisCoinPair], {
                account: oracle.owner.account!,
            });
        }

        await contracts.token.write.transfer([coinPairPrice.address, 330000000000000000n], {
            account: oracleData[0].owner.account!,
        });
        await coinPairPrice.write.switchRound();

        const roundInfo = await coinPairPrice.read.getRoundInfo();
        expect(roundInfo[5]).to.have.lengthOf(cantOracles);
    }

    async function signWithOwner(
        coinPairPrice: ContractOf<'CoinPairPrice'>,
        oracleData: OracleData[],
        cantSignatures: number,
    ) {
        const sender = oracleData[0].account;
        const thisCoinPair = await coinPairPrice.read.getCoinPair();
        const lastPubBlock = await coinPairPrice.read.getLastPublicationBlock();
        const { msg, encMsg } = await getDefaultEncodedMessage(
            3,
            'BTCUSD',
            10n ** 18n,
            sender.account!.address,
            lastPubBlock,
        );

        const signatures = [
            parseSignature(
                await sender.signMessage({
                    account: sender.account!,
                    message: { raw: encMsg },
                }),
            ),
        ];

        for (let i = 0; i < cantSignatures; i += 1) {
            const signer = oracleData[i + 1].account;
            signatures.push(
                parseSignature(
                    await signer.signMessage({
                        account: signer.account!,
                        message: { raw: encMsg },
                    }),
                ),
            );
        }

        for (const signature of signatures) {
            if (signature.v === undefined) {
                throw new Error('Signature.v is missing');
            }
        }

        await coinPairPrice.write.publishPrice(
            [
                msg.version,
                thisCoinPair,
                msg.price,
                msg.votedOracle,
                msg.blockNumber,
                signatures.map((signature) => Number(signature.v)),
                signatures.map((signature) => signature.r),
                signatures.map((signature) => signature.s),
            ],
            { account: sender.account! },
        );
    }

    for (const testGroup of testsToRun) {
        describe(`Test for ${testGroup.oracles} oracles`, function () {
            for (const test of testGroup.tests) {
                const signatures = test.signatures;
                const succeeds = 'success' in test && Boolean(test.success) && testGroup.oracles >= 3;
                const reason =
                    testGroup.oracles < 3
                        ? 'Minimum selected oracles required not reached'
                        : 'Valid signatures count must exceed 50% of active oracles';

                it(
                    `Should ${succeeds ? 'success' : 'fail'} with ${testGroup.oracles} oracle${testGroup.oracles === 1 ? '' : 's'}, ${signatures} signatures apart from owner`,
                    async function () {
                        const { viem, coinPairPrice, oracleData } = await setup(testGroup.oracles);
                        const publish = signWithOwner(coinPairPrice, oracleData, signatures);

                        if (succeeds) {
                            await publish;
                        } else {
                            await viem.assertions.revertWith(publish, reason);
                        }
                    },
                );
            }
        });
    }
});
