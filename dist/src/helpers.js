import { concatHex, numberToHex, padHex, parseSignature, stringToHex, getAddress, } from 'viem';
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';
export const MAX_UINT256 = (1n << 256n) - 1n;
export function addressFromNumber(value) {
    return getAddress(numberToHex(value, { size: 20 }));
}
export function toOracleDefinition(s) {
    return {
        owner: s.owner,
        signer: s.account,
        address: s.account.account.address,
        name: s.name,
    };
}
export function encodeCoinPair(name) {
    return stringToHex(name, { size: 32 });
}
export function decodeCoinPair(value) {
    const bytes = Buffer.from(value.slice(2), 'hex');
    const zeroIndex = bytes.indexOf(0);
    const end = zeroIndex === -1 ? bytes.length : zeroIndex;
    return bytes.subarray(0, end).toString('utf8');
}
export async function createGovernor(deployer, owner) {
    const governor = await deployer.deployProxy('Governor', [owner.account.address]);
    const executeChange = async (contract) => governor.write.executeChange([contract.address], { account: owner.account });
    const deployAndExec = async (contract, ...args) => executeChange(await deployer.deploy(contract, [...args]));
    return {
        addr: governor.address,
        address: governor.address,
        governor,
        registerCoinPair: async (manager, coinPair, address) => deployAndExec('OracleManagerPairChange', manager.address, coinPair, address),
        mint: async (tokenAddr, addr, quantity) => deployAndExec('TestMOCMintChange', tokenAddr, addr, quantity),
        execute: executeChange,
    };
}
export async function getLatestBlock(viem) {
    const publicClient = await viem.getPublicClient();
    return BigInt(await publicClient.getBlockNumber());
}
export async function increaseTime(networkHelpers, seconds) {
    await networkHelpers.time.increase(Number(seconds));
}
export async function increaseTimeTo(networkHelpers, timestamp) {
    await networkHelpers.time.increaseTo(Number(timestamp));
}
export async function mineUntilNextRound(networkHelpers, viem, coinPairPrice) {
    const lockPeriodTimestamp = (await coinPairPrice.read.getRoundInfo())[2];
    const target = lockPeriodTimestamp + 1n;
    const publicClient = await viem.getPublicClient();
    const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
    if (target > BigInt(latestBlock.timestamp)) {
        await increaseTime(networkHelpers, target - BigInt(latestBlock.timestamp));
    }
}
export async function getDefaultEncodedMessage(version, coinPair, price, votedOracle, blockNumber) {
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
export async function publishPrice(coinPairPrice, coinPairName, price, oracles, publisher) {
    const selectedPublisher = publisher ?? oracles[0];
    const sortedOracles = [...oracles].sort((a, b) => {
        const left = BigInt(a.address);
        const right = BigInt(b.address);
        return left > right ? -1 : left < right ? 1 : 0;
    });
    const lastPublicationBlock = await coinPairPrice.read.getLastPublicationBlock();
    const { msg, encMsg } = await getDefaultEncodedMessage(3, coinPairName, price, selectedPublisher.address, lastPublicationBlock);
    const sigV = [];
    const sigR = [];
    const sigS = [];
    for (const oracle of [...sortedOracles].reverse()) {
        const signature = parseSignature(await oracle.signer.signMessage({
            account: oracle.signer.account,
            message: {
                raw: encMsg,
            },
        }));
        if (signature.v === undefined) {
            throw new Error('Signature.v is missing');
        }
        sigV.push(Number(signature.v));
        sigR.push(signature.r);
        sigS.push(signature.s);
    }
    await coinPairPrice.write.publishPrice([
        msg.version,
        encodeCoinPair(coinPairName),
        msg.price,
        msg.votedOracle,
        msg.blockNumber,
        sigV,
        sigR,
        sigS,
    ], { account: selectedPublisher.address });
}
export async function initCoinpair(deployer, name, governor, token, oracleMgr, registry, whitelist, maxOraclesPerRound = 10n, maxSubscribedOraclesPerRound = 30n, roundLockPeriod = 60n, maxMissedSigRounds = 0n, validPricePeriodInBlocks = 3n, emergencyPublishingPeriodInBlocks = 2n, bootstrapPrice = 100000000n) {
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
export async function initContracts(deployer, governorOwner, period = 20n, minSubscriptionStake = 10n ** 18n, oracleManagerWhitelisted = [], withdrawLockTime = 60n * 60n, governor = null, wList = []) {
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
export async function initContractsWithCoinPairs(deployer, governorOwner, period = 3n, minSubscriptionStake = 10n ** 18n, whitelist = []) {
    const contracts = await initContracts(deployer, governorOwner, period, minSubscriptionStake, whitelist);
    const walletClients = await deployer.viem.getWalletClients();
    const effectiveWhitelist = whitelist.length > 0 ? whitelist : [walletClients[0].account.address];
    const coinPairPriceBTCUSD = await initCoinpair(deployer, 'BTCUSD', contracts.governor, contracts.token, contracts.oracleMgr, contracts.registry, effectiveWhitelist);
    const coinPairPriceRIFBTC = await initCoinpair(deployer, 'RIFBTC', contracts.governor, contracts.token, contracts.oracleMgr, contracts.registry, effectiveWhitelist);
    return {
        ...contracts,
        coinPairPriceBTCUSD,
        coinPairPriceRIFBTC,
    };
}
//# sourceMappingURL=helpers.js.map