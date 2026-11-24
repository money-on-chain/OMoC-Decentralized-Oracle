import assert from 'node:assert/strict';
import { network } from 'hardhat';
import {
    concatHex,
    encodeAbiParameters,
    keccak256,
    numberToHex,
    parseSignature,
    stringToHex,
    type Address,
    type Hex,
} from 'viem';
import {
    Deployer,
    getEvents,
    type ContractOf,
    type Viem,
    type WalletClients,
} from 'ts-test-helpers';
import { encodeCoinPair, initContracts, mineUntilNextRound } from '../src/helpers.js';
import RewardsPublisherModule from '../ignition/modules/RewardsPublisher.js';

const NAME = encodeCoinPair('BPRO_REWARDS');
const STAKE = 10n ** 18n;
const ROUND_CONFIG = {
    maxOraclesPerRound: 5n,
    maxSubscribedOraclesPerRound: 10n,
    roundLockPeriod: 60n,
    maxMissedSigRounds: 0n,
};
type EpochData = {
    epoch: bigint;
    merkleRoot: Hex;
    cid: string;
    snapshotBlock: bigint;
    distributedToday: bigint;
};

describe('RewardsPublisher', function () {
    let connection: Awaited<ReturnType<typeof network.create>>;
    let viem: Viem;
    let accounts: WalletClients;
    let deployer: Deployer;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let publisher: ContractOf<'RewardsPublisher'>;
    let distributor: ContractOf<'MockRewardsDistributor'>;
    let data: EpochData;

    async function deployPublisher(target = distributor.address, minimum = 2n) {
        return deployer.deployProxy('RewardsPublisher', [
            contracts.governor.address,
            NAME,
            target,
            contracts.token.address,
            ROUND_CONFIG,
            contracts.oracleMgr.address,
            contracts.registry.address,
            minimum,
        ]);
    }

    beforeEach(async function () {
        connection = await network.create();
        viem = connection.viem;
        accounts = await viem.getWalletClients();
        deployer = await Deployer.default(viem);
        contracts = await initContracts(deployer, accounts[0], 20n, STAKE, [
            accounts[9].account!.address,
        ]);
        distributor = await deployer.deploy('MockRewardsDistributor');
        publisher = await deployPublisher();
        await contracts.governor.registerCoinPair(contracts.oracleMgr, NAME, publisher.address);
        for (const ownerIndex of [1, 3, 5]) {
            const owner = accounts[ownerIndex];
            await contracts.governor.mint(contracts.token.address, owner.account!.address, STAKE);
            await contracts.token.write.approve([contracts.staking.address, STAKE], {
                account: owner.account!,
            });
            await contracts.staking.write.deposit([STAKE, owner.account!.address], {
                account: owner.account!,
            });
            await contracts.oracleMgr.write.registerOracle(
                [owner.account!.address, accounts[ownerIndex + 1].account!.address, 'oracle.io'],
                { account: accounts[9].account! },
            );
            await contracts.oracleMgr.write.subscribeToCoinPair([owner.account!.address, NAME], {
                account: accounts[9].account!,
            });
        }
        await publisher.write.switchRound();
        await distributor.write.setOperator([publisher.address]);
        data = {
            epoch: 1n,
            merkleRoot: keccak256(stringToHex('rewards')),
            cid: 'bafy-rewards-fixture',
            snapshotBlock: await (await viem.getPublicClient()).getBlockNumber(),
            distributedToday: 100n,
        };
    });

    async function sign(
        payload = data,
        signerIndices = [2, 4],
        target = publisher,
        version = 3n,
        name = NAME,
        votedOracle: Address = accounts[2].account!.address,
    ) {
        const blockNumber = await target.read.getLastPublicationBlock();
        const client = await viem.getPublicClient();
        const payloadHash = keccak256(
            encodeAbiParameters(
                [
                    { type: 'uint256' },
                    { type: 'address' },
                    { type: 'uint256' },
                    { type: 'bytes32' },
                    { type: 'bytes32' },
                    { type: 'uint256' },
                    { type: 'uint256' },
                ],
                [
                    BigInt(await client.getChainId()),
                    target.address,
                    payload.epoch,
                    payload.merkleRoot,
                    keccak256(stringToHex(payload.cid)),
                    payload.snapshotBlock,
                    payload.distributedToday,
                ],
            ),
        );
        assert.equal(await target.read.getEpochDataHash([payload]), payloadHash);
        const message = concatHex([
            numberToHex(version, { size: 32 }),
            name,
            payloadHash,
            votedOracle,
            numberToHex(blockNumber, { size: 32 }),
        ]);
        const signatures = await Promise.all(
            signerIndices.map(async (index) => ({
                address: accounts[index].account!.address,
                ...parseSignature(
                    await accounts[index].signMessage({
                        account: accounts[index].account!,
                        message: { raw: message },
                    }),
                ),
            })),
        );
        signatures.sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()));
        return [
            version,
            name,
            payload,
            votedOracle,
            blockNumber,
            signatures.map((s) => Number(s.v)),
            signatures.map((s) => s.r),
            signatures.map((s) => s.s),
        ] as const;
    }

    async function publish(args: Awaited<ReturnType<typeof sign>>, sender = accounts[2]) {
        return publisher.write.publishEpoch(args, { account: sender.account! });
    }

    it('forwards every argument without reading Distributor and awards one point', async function () {
        const args = await sign();
        const round = (await publisher.read.getRoundInfo())[0];
        const tx = await publish(args);
        const events = await getEvents(viem, distributor, 'PublicationReceived', undefined, tx);
        assert.equal(events.length, 1);
        assert.deepEqual(events[0].args, {
            epoch: data.epoch,
            root: data.merkleRoot,
            cid: data.cid,
            snapshotBlock: data.snapshotBlock,
            amount: data.distributedToday,
        });
        assert.equal((await publisher.read.getRoundInfo())[3], 1n);
        const receipt = await (await viem.getPublicClient()).getTransactionReceipt({ hash: tx });
        assert.equal(await publisher.read.getLastPublicationBlock(), receipt.blockNumber);
        assert.equal(
            await publisher.read.getLastSignedRound([accounts[1].account!.address]),
            round,
        );
    });

    it('rejects changes to each forwarded argument under the same signatures', async function () {
        const args = await sign();
        const mutations: EpochData[] = [
            { ...data, epoch: 2n },
            { ...data, merkleRoot: keccak256(stringToHex('different')) },
            { ...data, cid: `${data.cid}-changed` },
            { ...data, snapshotBlock: data.snapshotBlock + 1n },
            { ...data, distributedToday: 101n },
        ];
        for (const mutation of mutations) {
            await assert.rejects(
                publish([args[0], args[1], mutation, args[3], args[4], args[5], args[6], args[7]]),
                /Valid signatures count must exceed 50%|Signatures are not unique or not ordered/,
            );
        }
        await publish(args);
    });

    it('enforces quorum, ordered unique signatures, name, version and chosen sender', async function () {
        await viem.assertions.revertWith(
            publish(await sign(data, [2])),
            'Valid signatures count must exceed 50% of active oracles',
        );
        await viem.assertions.revertWith(
            publish(await sign(data, [2, 2])),
            'Signatures are not unique or not ordered by address',
        );
        const args = await sign();
        await viem.assertions.revertWith(
            publish([
                args[0],
                args[1],
                args[2],
                args[3],
                args[4],
                [...args[5]].reverse(),
                [...args[6]].reverse(),
                [...args[7]].reverse(),
            ]),
            'Signatures are not unique or not ordered by address',
        );
        await viem.assertions.revertWith(
            publish(await sign(data, [2, 4], publisher, 4n)),
            'This contract accepts only V3 format',
        );
        await viem.assertions.revertWith(
            publish(await sign(data, [2, 4], publisher, 3n, encodeCoinPair('OTHER'))),
            'Name - contract mismatch',
        );
        await viem.assertions.revertWith(
            publish(args, accounts[4]),
            'Your address does not match the voted oracle',
        );
        await viem.assertions.revertWith(
            publish(args, accounts[7]),
            'Voter oracle is not part of this round',
        );
    });

    it('rejects replay after a successful publication', async function () {
        const args = await sign();
        await publish(args);
        await viem.assertions.revertWith(
            publish(args),
            'Blocknumber does not match the last publication block',
        );
        await publish(await sign({ ...data, epoch: 2n, snapshotBlock: data.snapshotBlock + 1n }));
    });

    it('rolls back nonce, points and signer activity when Distributor rejects, allowing retry', async function () {
        const args = await sign();
        await distributor.write.setRejectPublication([true]);
        await viem.assertions.revertWith(publish(args), 'Publication rejected');
        assert.equal(await publisher.read.getLastPublicationBlock(), args[4]);
        assert.equal((await publisher.read.getRoundInfo())[3], 0n);
        assert.equal(await publisher.read.getLastSignedRound([accounts[1].account!.address]), 0n);
        await distributor.write.setRejectPublication([false]);
        await publish(args);
    });

    it('continues epochs published by the centralized operator and leaves validation to Distributor', async function () {
        await distributor.write.setOperator([accounts[0].account!.address]);
        await distributor.write.publishEpoch([
            data.epoch,
            data.merkleRoot,
            data.cid,
            data.snapshotBlock,
            data.distributedToday,
        ]);
        const oldCandidate = await sign();
        await viem.assertions.revertWith(publish(oldCandidate), 'Not operator');
        await distributor.write.setOperator([publisher.address]);
        await viem.assertions.revertWith(publish(oldCandidate), 'Invalid epoch');
        await publish(await sign({ ...data, epoch: 2n }));
    });

    it('isolates beneficiaries funds from oracle round incentives', async function () {
        await contracts.governor.mint(contracts.token.address, distributor.address, 1000n);
        await contracts.governor.mint(contracts.token.address, publisher.address, 200n);
        await publish(await sign());
        const ownerBalance = await contracts.token.read.balanceOf([accounts[1].account!.address]);
        await mineUntilNextRound(connection.networkHelpers, viem, publisher);
        await publisher.write.switchRound();
        assert.equal(await contracts.token.read.balanceOf([distributor.address]), 1000n);
        assert.equal(await contracts.token.read.balanceOf([publisher.address]), 0n);
        assert.equal(
            await contracts.token.read.balanceOf([accounts[1].account!.address]),
            ownerBalance + 200n,
        );
    });

    it('binds the payload hash to this deployment and chain', async function () {
        const other = await deployPublisher();
        assert.notEqual(
            await publisher.read.getEpochDataHash([data]),
            await other.read.getEpochDataHash([data]),
        );
        const chainId = BigInt(await (await viem.getPublicClient()).getChainId());
        const wrongChain = keccak256(
            encodeAbiParameters(
                [
                    { type: 'uint256' },
                    { type: 'address' },
                    { type: 'uint256' },
                    { type: 'bytes32' },
                    { type: 'bytes32' },
                    { type: 'uint256' },
                    { type: 'uint256' },
                ],
                [
                    chainId + 1n,
                    publisher.address,
                    data.epoch,
                    data.merkleRoot,
                    keccak256(stringToHex(data.cid)),
                    data.snapshotBlock,
                    data.distributedToday,
                ],
            ),
        );
        assert.notEqual(await publisher.read.getEpochDataHash([data]), wrongChain);
    });

    it('locks initialization, validates the target and restricts governance settings', async function () {
        const initArgs = [
            contracts.governor.address,
            NAME,
            distributor.address,
            contracts.token.address,
            ROUND_CONFIG,
            contracts.oracleMgr.address,
            contracts.registry.address,
            2n,
        ] as const;
        await viem.assertions.revertWith(
            publisher.write.initialize(initArgs),
            'Contract instance has already been initialized',
        );
        const implementation = await deployer.deploy('RewardsPublisher');
        await viem.assertions.revertWith(
            implementation.write.initialize(initArgs),
            'Contract instance has already been initialized',
        );
        await viem.assertions.revertWith(
            publisher.write.setMinOraclesPerRound([1n]),
            'not_authorized_changer',
        );
        const registryMinimum = await deployPublisher(distributor.address, 0n);
        assert.equal(await registryMinimum.read.getMinOraclesPerRound(), 3n);
    });

    it('deploys an initialized proxy and prepares the registration change with Ignition', async function () {
        const deployed = await connection.ignition.deploy(RewardsPublisherModule, {
            parameters: {
                RewardsPublisherModule: {
                    governor: contracts.governor.address,
                    name: encodeCoinPair('REWARDS_NEW'),
                    distributor: distributor.address,
                    token: contracts.token.address,
                    oracleManager: contracts.oracleMgr.address,
                    registry: contracts.registry.address,
                    proxyAdmin: deployer.proxyAdmin.address,
                    ...ROUND_CONFIG,
                    minOraclesPerRound: 2n,
                },
            },
        });
        const deployedPublisher = await viem.getContractAt(
            'RewardsPublisher',
            deployed.publisher.address,
        );
        assert.equal(
            (await deployedPublisher.read.distributor()).toLowerCase(),
            distributor.address.toLowerCase(),
        );
        assert.equal(await deployedPublisher.read.getMinOraclesPerRound(), 2n);
        assert.equal(await deployedPublisher.read.getName(), encodeCoinPair('REWARDS_NEW'));
        const change = await viem.getContractAt(
            'OracleManagerPairChange',
            deployed.registrationChange.address,
        );
        assert.equal(
            (await change.read.contractAddr()).toLowerCase(),
            deployed.publisher.address.toLowerCase(),
        );
        await contracts.governor.execute(change);
        assert.equal(
            (await deployedPublisher.read.governor()).toLowerCase(),
            contracts.governor.address.toLowerCase(),
        );
    });
});
