import assert from 'node:assert/strict';
import { expect } from 'chai';
import { network } from 'hardhat';
import {
    concatHex,
    encodeAbiParameters,
    keccak256,
    numberToHex,
    parseSignature,
    zeroAddress,
    zeroHash,
} from 'viem';
import { encodeCoinPair, initContracts, mineUntilNextRound } from '../src/helpers.js';
import { getEvents } from 'ts-test-helpers';
import {
    assertSameAddress,
    Deployer,
    type ContractOf,
    type NetworkHelpers,
    type Viem,
    type WalletClients,
} from 'ts-test-helpers';

describe('LiquidationEngine', function () {
    const GOVERNOR_OWNER = 0;
    const WHITELISTED_CALLER = 9;
    const ORACLE_OWNER = 1;
    const ORACLE_ACCOUNT = 2;
    const MIN_STAKE = 10n ** 18n;
    const MAX_LIQUIDATIONS_PER_BATCH = 10n;
    const ENGINE_NAME = encodeCoinPair('LENDING');

    let viem: Viem;
    let networkHelpers: NetworkHelpers;
    let deployer: Deployer;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let infoGetter: ContractOf<'InfoGetter'>;
    let engine: ContractOf<'LiquidationEngine'>;
    let manager: ContractOf<'MockLendingManager'>;
    let tokenToCoinbaseProvider: ContractOf<'MockIPriceProvider'>;
    let baseFeeProvider: ContractOf<'MockIPriceProvider'>;
    let pool0: { tpToken: `0x${string}`; mocBucket: `0x${string}` };
    let pool1: { tpToken: `0x${string}`; mocBucket: `0x${string}` };
    let pool0Id: `0x${string}`;
    let pool1Id: `0x${string}`;

    async function deployEngine(
        pools: { tpToken: `0x${string}`; mocBucket: `0x${string}` }[],
        maxLiquidationsPerBatch = MAX_LIQUIDATIONS_PER_BATCH,
    ) {
        return deployer.deployProxy('LiquidationEngine', [
            contracts.governor.address,
            ENGINE_NAME,
            manager.address,
            pools,
            contracts.token.address,
            {
                maxOraclesPerRound: 5n,
                maxSubscribedOraclesPerRound: 10n,
                roundLockPeriod: 60n,
                maxMissedSigRounds: 0n,
            },
            contracts.oracleMgr.address,
            contracts.registry.address,
            1n,
            {
                tokenToCoinbasePriceProvider: tokenToCoinbaseProvider.address,
                baseFeeProvider: baseFeeProvider.address,
                sharesCapMultiplier: 15n * 10n ** 17n,
                maxLiquidationsPerBatch,
            },
        ]);
    }

    async function deployFixture() {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
        contracts = await initContracts(deployer, accounts[GOVERNOR_OWNER], 20n, MIN_STAKE, [
            accounts[WHITELISTED_CALLER].account!.address,
        ]);
        infoGetter = await deployer.deployProxy('InfoGetter', [contracts.governor.address]);

        manager = await deployer.deploy('MockLendingManager');
        tokenToCoinbaseProvider = await deployer.deploy('MockIPriceProvider', [
            833333333333n,
            true,
            0n,
        ]);
        baseFeeProvider = await deployer.deploy('MockIPriceProvider', [1n, true, 0n]);
        pool0 = {
            tpToken: accounts[10].account!.address,
            mocBucket: accounts[11].account!.address,
        };
        pool1 = {
            tpToken: accounts[12].account!.address,
            mocBucket: accounts[13].account!.address,
        };

        engine = await deployEngine([pool0, pool1]);
        pool0Id = keccak256(
            encodeAbiParameters(
                [{ type: 'address' }, { type: 'address' }],
                [pool0.tpToken, pool0.mocBucket],
            ),
        );
        pool1Id = keccak256(
            encodeAbiParameters(
                [{ type: 'address' }, { type: 'address' }],
                [pool1.tpToken, pool1.mocBucket],
            ),
        );

        await contracts.governor.registerCoinPair(contracts.oracleMgr, ENGINE_NAME, engine.address);
        await contracts.governor.mint(
            contracts.token.address,
            accounts[ORACLE_OWNER].account!.address,
            MIN_STAKE,
        );
        await contracts.token.write.approve([contracts.staking.address, MIN_STAKE], {
            account: accounts[ORACLE_OWNER].account!,
        });
        await contracts.staking.write.deposit(
            [MIN_STAKE, accounts[ORACLE_OWNER].account!.address],
            { account: accounts[ORACLE_OWNER].account! },
        );
        await contracts.oracleMgr.write.registerOracle(
            [
                accounts[ORACLE_OWNER].account!.address,
                accounts[ORACLE_ACCOUNT].account!.address,
                'oracle-a.io',
            ],
            { account: accounts[WHITELISTED_CALLER].account! },
        );
        await contracts.oracleMgr.write.subscribeToCoinPair(
            [accounts[ORACLE_OWNER].account!.address, ENGINE_NAME],
            { account: accounts[WHITELISTED_CALLER].account! },
        );
        await engine.write.switchRound({ account: accounts[ORACLE_OWNER].account! });
    }

    async function authorize(blockNumber = engine.read.getLastPublicationBlock()) {
        const nonce = await blockNumber;
        const authorization = {
            version: 3n,
            name: ENGINE_NAME,
            votedOracle: accounts[ORACLE_ACCOUNT].account!.address,
            blockNumber: nonce,
        };
        const message = concatHex([
            numberToHex(authorization.version, { size: 32 }),
            authorization.name,
            authorization.votedOracle,
            numberToHex(authorization.blockNumber, { size: 32 }),
        ]);
        const signature = parseSignature(
            await accounts[ORACLE_ACCOUNT].signMessage({
                account: accounts[ORACLE_ACCOUNT].account!,
                message: { raw: message },
            }),
        );
        assert(signature.v !== undefined);
        return {
            ...authorization,
            signatures: [[Number(signature.v)], [signature.r], [signature.s]] as const,
        };
    }

    function runArguments(
        authorization: Awaited<ReturnType<typeof authorize>>,
        liquidations: { poolId: `0x${string}`; users: `0x${string}`[] }[],
    ) {
        return [
            authorization.version,
            authorization.name,
            liquidations,
            authorization.votedOracle,
            authorization.blockNumber,
            ...authorization.signatures,
        ] as const;
    }

    beforeEach(deployFixture);

    it('derives pool ids deterministically from the market addresses', async function () {
        expect(await engine.read.getPoolId([pool0.tpToken, pool0.mocBucket])).to.equal(pool0Id);
        expect(await engine.read.getPoolId([pool1.tpToken, pool1.mocBucket])).to.equal(pool1Id);
        const firstPool = await engine.read.pools([pool0Id]);
        const secondPool = await engine.read.pools([pool1Id]);

        assertSameAddress(firstPool[0], pool0.tpToken);
        assertSameAddress(firstPool[1], pool0.mocBucket);
        expect(firstPool[2]).to.equal(true);
        assertSameAddress(secondPool[0], pool1.tpToken);
        assertSameAddress(secondPool[1], pool1.mocBucket);
    });

    it('rejects invalid and duplicate pools during registration', async function () {
        await viem.assertions.revertWith(
            deployEngine([{ tpToken: zeroAddress, mocBucket: pool0.mocBucket }]),
            'TP token cannot be zero',
        );
        await viem.assertions.revertWith(
            deployEngine([{ tpToken: pool0.tpToken, mocBucket: zeroAddress }]),
            'MOC bucket cannot be zero',
        );
        await viem.assertions.revertWith(deployEngine([pool0, pool0]), 'Pool already registered');
    });

    it('requires a positive liquidation batch limit', async function () {
        await viem.assertions.revertWith(
            deployEngine([pool0], 0n),
            'Max liquidations per batch must be positive',
        );
        expect(await engine.read.maxLiquidationsPerBatch()).to.equal(MAX_LIQUIDATIONS_PER_BATCH);
    });

    it('supports legacy coin-pair discovery through InfoGetter', async function () {
        const uiInfo = await infoGetter.read.getCoinPairUIInfo([engine.address]);
        expect(uiInfo.validPricePeriodInBlocks).to.equal(0n);

        const serverInfo = await infoGetter.read.getOracleServerInfo([
            contracts.oracleMgr.address,
            engine.address,
        ]);
        expect(serverInfo.price).to.equal(0n);
        expect(serverInfo.validPricePeriodInBlocks).to.equal(0n);
        expect(await engine.read.getPrice()).to.equal(0n);
    });

    it('lets the authorized publisher choose and group liquidations by pool', async function () {
        const user0 = accounts[14].account!.address;
        const user1 = accounts[15].account!.address;
        await manager.write.setShouldLiquidate([user0, true]);
        await manager.write.setShouldLiquidate([user1, true]);
        const authorization = await authorize();
        const liquidations = [
            { poolId: pool0Id, users: [user0] },
            { poolId: pool1Id, users: [user1] },
        ];

        const tx = await engine.write.runLiquidations(runArguments(authorization, liquidations), {
            account: accounts[ORACLE_ACCOUNT].account!,
        });

        expect(await manager.read.liquidationCount()).to.equal(2n);
        assertSameAddress(await manager.read.lastTpToken(), pool1.tpToken);
        assertSameAddress(await manager.read.lastMocBucket(), pool1.mocBucket);
        const events = await getEvents(viem, engine, 'LiquidationExecuted', undefined, tx);
        expect(events).to.have.lengthOf(2);
        expect(events.map((event) => event.args!.poolId)).to.deep.equal([pool0Id, pool1Id]);
        expect(events.every((event) => event.args!.success)).to.equal(true);
    });

    it('continues after a failed liquidation and rewards only successes', async function () {
        const successUser = accounts[14].account!.address;
        const failingUser = accounts[15].account!.address;
        await manager.write.setShouldLiquidate([successUser, true]);
        const authorization = await authorize();
        const liquidations = [{ poolId: pool0Id, users: [failingUser, successUser] }];

        const tx = await engine.write.runLiquidations(runArguments(authorization, liquidations), {
            account: accounts[ORACLE_ACCOUNT].account!,
        });

        expect(await manager.read.liquidationCount()).to.equal(1n);
        const events = await getEvents(viem, engine, 'LiquidationExecuted', undefined, tx);
        expect(events.map((event) => event.args!.success)).to.deep.equal([false, true]);
        const roundInfo = await engine.read.getRoundInfo();
        expect(roundInfo[3]).to.equal(1n);
        const reimbursable = await engine.read.oracleOwnerCoinbaseUsed([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        expect(reimbursable > 0n).to.equal(true);
    });

    it('reverts without consuming the authorization when no liquidation succeeds', async function () {
        const authorization = await authorize();
        const liquidations = [{ poolId: pool0Id, users: [accounts[14].account!.address] }];

        await viem.assertions.revertWith(
            engine.write.runLiquidations(runArguments(authorization, liquidations), {
                account: accounts[ORACLE_ACCOUNT].account!,
            }),
            'No liquidation executed',
        );

        const roundInfo = await engine.read.getRoundInfo();
        expect(roundInfo[3]).to.equal(0n);
        expect(await engine.read.getLastPublicationBlock()).to.equal(authorization.blockNumber);
        expect(
            await engine.read.oracleOwnerCoinbaseUsed([accounts[ORACLE_OWNER].account!.address]),
        ).to.equal(0n);
    });

    it('rejects an empty batch without consuming the authorization', async function () {
        const authorization = await authorize();

        await viem.assertions.revertWith(
            engine.write.runLiquidations(runArguments(authorization, []), {
                account: accounts[ORACLE_ACCOUNT].account!,
            }),
            'No liquidation executed',
        );
        expect(await engine.read.getLastPublicationBlock()).to.equal(authorization.blockNumber);
    });

    it('allows repeated users up to the batch limit for partial liquidations', async function () {
        const user = accounts[14].account!.address;
        await manager.write.setShouldLiquidate([user, true]);
        const authorization = await authorize();
        const users = Array.from({ length: Number(MAX_LIQUIDATIONS_PER_BATCH) }, () => user);

        await engine.write.runLiquidations(
            runArguments(authorization, [{ poolId: pool0Id, users }]),
            { account: accounts[ORACLE_ACCOUNT].account! },
        );

        expect(await manager.read.liquidationCount()).to.equal(MAX_LIQUIDATIONS_PER_BATCH);
        expect((await engine.read.getRoundInfo())[3]).to.equal(MAX_LIQUIDATIONS_PER_BATCH);
    });

    it('only executes attempts up to the liquidation limit', async function () {
        const user = accounts[14].account!.address;
        await manager.write.setShouldLiquidate([user, true]);
        const authorization = await authorize();
        const users = Array.from({ length: Number(MAX_LIQUIDATIONS_PER_BATCH + 1n) }, () => user);

        await engine.write.runLiquidations(
            runArguments(authorization, [{ poolId: pool0Id, users }]),
            { account: accounts[ORACLE_ACCOUNT].account! },
        );

        expect(await manager.read.liquidationCount()).to.equal(MAX_LIQUIDATIONS_PER_BATCH);
        expect((await engine.read.getRoundInfo())[3]).to.equal(MAX_LIQUIDATIONS_PER_BATCH);
    });

    it('distributes the full points reward to an oracle with all of the selected stake', async function () {
        const user = accounts[14].account!.address;
        await manager.write.setShouldLiquidate([user, true]);
        const authorization = await authorize();
        await engine.write.runLiquidations(
            runArguments(authorization, [{ poolId: pool0Id, users: [user] }]),
            { account: accounts[ORACLE_ACCOUNT].account! },
        );

        const initialOracleBalance = await contracts.token.read.balanceOf([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        await contracts.governor.mint(contracts.token.address, engine.address, MIN_STAKE);
        await mineUntilNextRound(networkHelpers, viem, engine);
        await engine.write.switchRound({ account: accounts[ORACLE_OWNER].account! });

        const finalOracleBalance = await contracts.token.read.balanceOf([
            accounts[ORACLE_OWNER].account!.address,
        ]);
        expect(finalOracleBalance - initialOracleBalance).to.equal(MIN_STAKE);
        expect(await contracts.token.read.balanceOf([engine.address])).to.equal(0n);
    });

    it('rejects a pool id that was not registered', async function () {
        const authorization = await authorize();
        const liquidations = [{ poolId: zeroHash, users: [accounts[14].account!.address] }];

        await viem.assertions.revertWith(
            engine.write.runLiquidations(runArguments(authorization, liquidations), {
                account: accounts[ORACLE_ACCOUNT].account!,
            }),
            'Pool unavailable',
        );
    });

    it('cannot reuse an authorization after a publication', async function () {
        const user = accounts[14].account!.address;
        await manager.write.setShouldLiquidate([user, true]);
        const authorization = await authorize();
        const liquidations = [{ poolId: pool0Id, users: [user] }];
        await engine.write.runLiquidations(runArguments(authorization, liquidations), {
            account: accounts[ORACLE_ACCOUNT].account!,
        });

        await viem.assertions.revertWith(
            engine.write.runLiquidations(runArguments(authorization, liquidations), {
                account: accounts[ORACLE_ACCOUNT].account!,
            }),
            'Blocknumber does not match the last publication block',
        );
    });
});
