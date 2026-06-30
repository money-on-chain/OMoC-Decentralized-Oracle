import {
    concatHex,
    numberToHex,
    padHex,
    parseSignature,
    stringToHex,
    Address,
    Hex,
    getAddress,
} from 'viem';

import { ContractOf, Deployer, Viem, WalletClient } from 'ts-test-helpers';
import { GetContractReturnType, Abi, ContractEventName } from 'viem';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';
export const MAX_UINT256 = (1n << 256n) - 1n;

export function addressFromNumber(value: number): Address {
    return getAddress(numberToHex(value, { size: 20 }));
}

export type OracleDefinition = {
    owner: WalletClient;
    signer?: WalletClient;
    address: Address;
    url?: string;
    name: string;
};

export type OracleStakeData = {
    name: string;
    stake: bigint;
    account: WalletClient;
    owner: WalletClient;
    address: Address;
};

export function toOracleDefinition(s: OracleStakeData): OracleDefinition {
    return {
        owner: s.owner,
        signer: s.account,
        address: s.account.account!.address,
        name: s.name,
    };
}

export function encodeCoinPair(name: string) {
    return stringToHex(name, { size: 32 });
}

export function decodeCoinPair(value: string) {
    const bytes = Buffer.from(value.slice(2), 'hex');
    const zeroIndex = bytes.indexOf(0);
    const end = zeroIndex === -1 ? bytes.length : zeroIndex;

    return bytes.subarray(0, end).toString('utf8');
}

export function bytes32ToBigInt(value: string) {
    return BigInt(value);
}

export async function createGovernor(deployer: Deployer, owner: WalletClient) {
    const governor = await deployer.deployProxy('Governor', [owner.account!.address]);

    const executeChange = async (contract: GetContractReturnType) =>
        governor.write.executeChange([contract.address], { account: owner.account });

    const deployAndExec = async (contract: any, ...args: any[]) =>
        executeChange(await deployer.deploy(contract, args));

    return {
        addr: governor.address,
        address: governor.address,
        governor,

        registerCoinPair: async (manager: any, coinPair: string, address: string) =>
            deployAndExec('OracleManagerPairChange', manager.address, coinPair, address),
        mint: async (tokenAddr: string, addr: string, quantity: bigint) =>
            deployAndExec('TestMOCMintChange', tokenAddr, addr, quantity),
        execute: executeChange,
    };
}

export async function waitForEvents<
    EventFn extends (...args: any[]) => Promise<any[]>,
    Events extends Record<string, EventFn>,
    Source extends { abi: Abi; getEvents: Events },
    EventName extends ContractEventName<Source['abi']> & string,
    Result extends Awaited<ReturnType<EventFn>>,
    Item extends Result[number],
>(
    viem: Viem,
    source: Source,
    eventName: EventName,
    txHash?: Hex,
    fromBlock: bigint = 0n,
    toBlock?: bigint,
): Promise<Result> {
    const publicClient = await viem.getPublicClient();
    const getEvents = source.getEvents[eventName];

    if (getEvents === undefined) {
        throw new Error(`Event ${eventName} not found on contract`);
    }

    if (txHash) {
        const tx = await publicClient.getTransactionReceipt({ hash: txHash });
        const events = await getEvents(undefined, { blockHash: tx.blockHash });
        return events.filter((e: Item) => e.transactionHash === txHash) as Result;
    } else {
        return (await getEvents(undefined, { fromBlock, toBlock })) as Result;
    }
}

export async function getLatestBlock(viem: Viem) {
    const publicClient = await viem.getPublicClient();
    return BigInt(await publicClient.getBlockNumber());
}

export async function mineUntilBlock(networkHelpers: any, viem: Viem, target: number | bigint) {
    const blockTarget = BigInt(target);
    let latestBlock = await getLatestBlock(viem);

    while (latestBlock < blockTarget) {
        await networkHelpers.mine();
        latestBlock = await getLatestBlock(viem);
    }
}

export async function increaseTime(networkHelpers: any, seconds: number | bigint) {
    await networkHelpers.time.increase(Number(seconds));
}

export async function increaseTimeTo(networkHelpers: any, timestamp: number | bigint) {
    await networkHelpers.time.increaseTo(Number(timestamp));
}

export async function mineUntilNextRound(networkHelpers: any, viem: Viem, coinPairPrice: any) {
    const lockPeriodTimestamp = (await coinPairPrice.read.getRoundInfo())[2];
    const target = lockPeriodTimestamp + 1n;
    const publicClient = await viem.getPublicClient();
    const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });

    if (target > BigInt(latestBlock.timestamp)) {
        await increaseTime(networkHelpers, target - BigInt(latestBlock.timestamp));
    }
}

export async function getDefaultEncodedMessage(
    version: number | bigint,
    coinPair: string,
    price: number | bigint,
    votedOracle: Address,
    blockNumber: number | bigint,
) {
    const encVersion = padHex(numberToHex(version), { size: 32 });
    const encCoinPair = encodeCoinPair(coinPair);
    const encPrice = padHex(numberToHex(price), { size: 32 });
    const encOracle = votedOracle;
    const encBlockNumber = padHex(numberToHex(blockNumber), { size: 32 });

    const encMsg = concatHex([encVersion, encCoinPair, encPrice, encOracle, encBlockNumber]);

    return {
        msg: {
            version: BigInt(version),
            coinPair,
            price: BigInt(price),
            votedOracle,
            blockNumber: BigInt(blockNumber),
        },
        encMsg,
    };
}

export async function publishPrice(
    coinPairPrice: ContractOf<'CoinPairPrice'>,
    coinPairName: string,
    price: bigint,
    oracles: OracleDefinition[],
    publisher?: OracleDefinition,
) {
    const selectedPublisher = publisher ?? oracles[0];
    const sortedOracles = [...oracles].sort((a, b) => {
        const left = BigInt(a.address);
        const right = BigInt(b.address);

        return left > right ? -1 : left < right ? 1 : 0;
    }) as OracleDefinition[];

    const lastPublicationBlock = await coinPairPrice.read.getLastPublicationBlock();
    const { msg, encMsg } = await getDefaultEncodedMessage(
        3,
        coinPairName,
        price,
        selectedPublisher.address,
        lastPublicationBlock,
    );

    const sigV: number[] = [];
    const sigR: Address[] = [];
    const sigS: Address[] = [];

    for (const oracle of [...sortedOracles].reverse()) {
        const signature = parseSignature(
            await oracle.signer!.signMessage({
                account: oracle.signer!.account!,
                message: {
                    raw: encMsg,
                },
            }),
        );

        if (signature.v === undefined) {
            throw new Error('Signature.v is missing');
        }

        sigV.push(Number(signature.v));
        sigR.push(signature.r);
        sigS.push(signature.s);
    }

    await coinPairPrice.write.publishPrice(
        [
            msg.version,
            encodeCoinPair(coinPairName),
            msg.price,
            msg.votedOracle,
            msg.blockNumber,
            sigV,
            sigR,
            sigS,
        ],
        { account: selectedPublisher.address },
    );
}

export async function initCoinpair(
    deployer: Deployer,
    name: string,
    governor: Awaited<ReturnType<typeof createGovernor>>,
    token: ContractOf<'GovernedERC20'>,
    oracleMgr: ContractOf<'OracleManager'>,
    registry: ContractOf<'GovernedRegistry'>,
    whitelist: Address[],
    maxOraclesPerRound = 10n,
    maxSubscribedOraclesPerRound = 30n,
    roundLockPeriod = 60n,
    maxMissedSigRounds = 0n,
    validPricePeriodInBlocks = 3n,
    emergencyPublishingPeriodInBlocks = 2n,
    bootstrapPrice = 100000000n,
): Promise<ContractOf<'CoinPairPrice'>> {
    const coinPairPrice = await deployer.deployProxy('CoinPairPrice', [
        governor.addr,
        whitelist,
        encodeCoinPair(name),
        token.address,
        {
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
            roundLockPeriod,
            maxMissedSigRounds,
        },
        validPricePeriodInBlocks,
        emergencyPublishingPeriodInBlocks,
        bootstrapPrice,
        oracleMgr.address,
        registry.address,
    ]);

    await governor.registerCoinPair(oracleMgr, encodeCoinPair(name), coinPairPrice.address);

    return coinPairPrice;
}

export async function initContracts(
    deployer: Deployer,
    governorOwner: WalletClient,
    period = 20n,
    minSubscriptionStake = 10n ** 18n,
    oracleManagerWhitelisted: Address[] = [],
    withdrawLockTime = 60n * 60n,
    governor = null,
    wList: Address[] = [],
): Promise<{
    governor: Awaited<ReturnType<typeof createGovernor>>;
    token: ContractOf<'GovernedERC20'>;
    oracleMgr: ContractOf<'OracleManager'>;
    supporters: ContractOf<'Supporters'>;
    delayMachine: ContractOf<'DelayMachine'>;
    staking: ContractOf<'Staking'>;
    stakingMock: ContractOf<'StakingMock'>;
    votingMachine: ContractOf<'MockVotingMachine'>;
    registry: ContractOf<'GovernedRegistry'>;
}> {
    const activeGovernor = governor ?? (await createGovernor(deployer, governorOwner));
    const token = await deployer.deployProxy('GovernedERC20', [activeGovernor.address]);

    const oracleMgr = await deployer.deployUninitializedProxy('OracleManager');
    const staking = await deployer.deployUninitializedProxy('Staking');

    const votingMachine = await deployer.deploy('MockVotingMachine', []);

    const delayMachine = await deployer.deployProxy('DelayMachine', [
        activeGovernor.address,
        token.address,
        staking.address,
    ]);
    const whitelist = [...wList, staking.address, ...oracleManagerWhitelisted];

    const supporters = await deployer.deployProxy('Supporters', [
        activeGovernor.address,
        [...whitelist, oracleMgr.address],
        token.address,
        period,
    ]);

    await oracleMgr.write.initialize([
        activeGovernor.address,
        minSubscriptionStake,
        staking.address,
        whitelist,
    ]);

    await staking.write.initialize([
        activeGovernor.address,
        supporters.address,
        oracleMgr.address,
        delayMachine.address,
        [votingMachine.address],
        withdrawLockTime,
    ]);

    const stakingMock = await deployer.deployProxy('StakingMock', [
        staking.address,
        supporters.address,
    ]);
    await votingMachine.write.initialize([staking.address]);
    const registry = await deployer.deployProxy('GovernedRegistry', [activeGovernor.address]);

    const change = await deployer.deploy('MocRegistryAddMinOraclesPerRoundChange', [
        registry.address,
    ]);
    await activeGovernor.execute(change);

    return {
        governor: activeGovernor,
        token,
        oracleMgr,
        supporters,
        delayMachine,
        staking,
        stakingMock,
        votingMachine,
        registry,
    };
}

export async function initContractsWithCoinPairs(
    deployer: Deployer,
    governorOwner: WalletClient,
    period = 3n,
    minSubscriptionStake = 10n ** 18n,
    whitelist: Address[] = [],
): Promise<
    Awaited<ReturnType<typeof initContracts>> & {
        coinPairPriceBTCUSD: ContractOf<'CoinPairPrice'>;
        coinPairPriceRIFBTC: ContractOf<'CoinPairPrice'>;
    }
> {
    const contracts = await initContracts(
        deployer,
        governorOwner,
        period,
        minSubscriptionStake,
        whitelist,
    );

    const walletClients = await deployer.viem.getWalletClients();
    const effectiveWhitelist =
        whitelist.length > 0 ? whitelist : [walletClients[0].account.address];

    const coinPairPriceBTCUSD = await initCoinpair(
        deployer,
        'BTCUSD',
        contracts.governor,
        contracts.token,
        contracts.oracleMgr,
        contracts.registry,
        effectiveWhitelist,
    );
    const coinPairPriceRIFBTC = await initCoinpair(
        deployer,
        'RIFBTC',
        contracts.governor,
        contracts.token,
        contracts.oracleMgr,
        contracts.registry,
        effectiveWhitelist,
    );

    return {
        ...contracts,
        coinPairPriceBTCUSD,
        coinPairPriceRIFBTC,
    };
}
