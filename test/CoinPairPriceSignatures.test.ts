import { expect } from 'chai';
import { network } from 'hardhat';
import { parseSignature, type Address } from 'viem';
import { getDefaultEncodedMessage, initCoinpair, initContracts } from '../src/helpers.js';
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
        const { viem, networkHelpers } = await network.create();
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

        return { viem, networkHelpers, coinPairPrice, oracleData };
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

    async function buildExpiringPublication(
        viem: Awaited<ReturnType<typeof network.create>>['viem'],
        coinPairPrice: ContractOf<'CoinPairPrice'>,
        oracleData: OracleData[],
        signatureVersions: (3 | 4)[],
        expirationOffset = 300n,
        v4ExpirationOffsets: (bigint | undefined)[] = [],
        signerIndexes?: number[],
    ) {
        const sender = oracleData[0].account;
        const coinPair = await coinPairPrice.read.getCoinPair();
        const lastPublicationBlock = await coinPairPrice.read.getLastPublicationBlock();
        const publicClient = await viem.getPublicClient();
        const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
        const expiration = BigInt(latestBlock.timestamp) + expirationOffset;
        const legacyMessage = await getDefaultEncodedMessage(
            3,
            'BTCUSD',
            10n ** 18n,
            sender.account!.address,
            lastPublicationBlock,
        );
        const expiringMessage = await getDefaultEncodedMessage(
            4,
            'BTCUSD',
            10n ** 18n,
            sender.account!.address,
            lastPublicationBlock,
            expiration,
        );
        const signatures = await Promise.all(
            signatureVersions.map(async (signatureVersion, index) => {
                const oracle = oracleData[signerIndexes?.[index] ?? index];
                const expirationOffsetOverride = v4ExpirationOffsets[index];
                const v4Message =
                    expirationOffsetOverride === undefined
                        ? expiringMessage
                        : await getDefaultEncodedMessage(
                              4,
                              'BTCUSD',
                              10n ** 18n,
                              sender.account!.address,
                              lastPublicationBlock,
                              expiration + expirationOffsetOverride,
                          );
                return parseSignature(
                    await oracle.account.signMessage({
                        account: oracle.account.account!,
                        message: {
                            raw:
                                signatureVersion === 4
                                    ? v4Message.encMsg
                                    : legacyMessage.encMsg,
                        },
                    }),
                );
            }),
        );

        for (const signature of signatures) {
            if (signature.v === undefined) {
                throw new Error('Signature.v is missing');
            }
        }

        return {
            sender,
            expiration,
            args: [
                4n,
                coinPair,
                10n ** 18n,
                sender.account!.address,
                lastPublicationBlock,
                expiration,
                signatures.map((signature) => Number(signature.v)),
                signatures.map((signature) => signature.r),
                signatures.map((signature) => signature.s),
            ] as const,
        };
    }

    it('accepts V3 and V4 signatures in the same expiring publication', async function () {
        const { viem, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [3, 4, 3],
        );

        await coinPairPrice.write.publishPriceWithExpiration(publication.args, {
            account: publication.sender.account!,
        });
    });

    it('accepts an expiring publication with all V4 signatures', async function () {
        const { viem, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [4, 4, 4],
        );

        await coinPairPrice.write.publishPriceWithExpiration(publication.args, {
            account: publication.sender.account!,
        });
    });

    it('accepts an expiring publication with all legacy V3 signatures', async function () {
        const { viem, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [3, 3, 3],
        );

        await coinPairPrice.write.publishPriceWithExpiration(publication.args, {
            account: publication.sender.account!,
        });
    });

    it('does not combine V4 signatures with different expirations', async function () {
        const { viem, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [4, 4, 4],
            300n,
            [undefined, 1n, 2n],
        );

        await viem.assertions.revertWith(
            coinPairPrice.write.publishPriceWithExpiration(publication.args, {
                account: publication.sender.account!,
            }),
            'Valid signatures count must exceed 50% of active oracles',
        );
    });

    it('does not count V3 and V4 signatures from the same oracle twice', async function () {
        const { viem, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [3, 4],
            300n,
            [],
            [0, 0],
        );

        await viem.assertions.revertWith(
            coinPairPrice.write.publishPriceWithExpiration(publication.args, {
                account: publication.sender.account!,
            }),
            'Signatures are not unique or not ordered by address',
        );
    });

    it('rejects an expiring publication after its deadline', async function () {
        const { viem, networkHelpers, coinPairPrice, oracleData } = await setup(3);
        const publication = await buildExpiringPublication(
            viem,
            coinPairPrice,
            oracleData,
            [3, 4, 3],
            30n,
        );

        await networkHelpers.time.increaseTo(Number(publication.expiration + 1n));
        await viem.assertions.revertWith(
            coinPairPrice.write.publishPriceWithExpiration(publication.args, {
                account: publication.sender.account!,
            }),
            'Signature expired',
        );
    });

    for (const testGroup of testsToRun) {
        describe(`Test for ${testGroup.oracles} oracles`, function () {
            for (const test of testGroup.tests) {
                const signatures = test.signatures;
                const succeeds =
                    'success' in test && Boolean(test.success) && testGroup.oracles >= 3;
                const reason =
                    testGroup.oracles < 3
                        ? 'Minimum selected oracles required not reached'
                        : 'Valid signatures count must exceed 50% of active oracles';

                it(`Should ${succeeds ? 'success' : 'fail'} with ${testGroup.oracles} oracle${testGroup.oracles === 1 ? '' : 's'}, ${signatures} signatures apart from owner`, async function () {
                    const { viem, coinPairPrice, oracleData } = await setup(testGroup.oracles);
                    const publish = signWithOwner(coinPairPrice, oracleData, signatures);

                    if (succeeds) {
                        await publish;
                    } else {
                        await viem.assertions.revertWith(publish, reason);
                    }
                });
            }
        });
    }
});
