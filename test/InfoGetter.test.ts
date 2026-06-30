import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts, publishPrice, type OracleDefinition } from './helpers.js';
import { Deployer, type ContractOf, type Viem, type WalletClients } from 'ts-test-helpers';

describe('InfoGetter', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let infoGetter: ContractOf<'InfoGetter'>;
    let coinPairPrice: ContractOf<'CoinPairPrice'>;

    const COINPAIR_NAME = 'BTCUSD';
    const ORACLE_FEES = 10n ** 18n;
    const ORACLE_STAKE = 10n ** 18n;

    before(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        contracts = await initContracts(deployer, accounts[8]);
        infoGetter = await deployer.deployProxy('InfoGetter', [contracts.governor.address]);

        coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address, infoGetter.address],
            3n,
            3n,
            60n,
            0n,
            3n,
        );

        const oracles: OracleDefinition[] = [
            {
                owner: accounts[2],
                signer: accounts[3],
                address: accounts[3].account!.address,
                name: 'oracle1',
            },
            {
                owner: accounts[4],
                signer: accounts[5],
                address: accounts[5].account!.address,
                name: 'oracle2',
            },
            {
                owner: accounts[6],
                signer: accounts[7],
                address: accounts[7].account!.address,
                name: 'oracle3',
            },
        ];

        const coinPairId = await coinPairPrice.read.getCoinPair();

        for (const oracle of oracles) {
            await contracts.governor.mint(
                contracts.token.address,
                oracle.owner.account!.address,
                ORACLE_STAKE,
            );
            await contracts.token.write.approve([contracts.staking.address, ORACLE_STAKE], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.registerOracle([oracle.address, oracle.name], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.deposit([ORACLE_STAKE, oracle.owner.account!.address], {
                account: oracle.owner.account!,
            });
            await contracts.staking.write.subscribeToCoinPair([coinPairId], {
                account: oracle.owner.account!,
            });
        }

        await coinPairPrice.write.switchRound();
        await publishPrice(coinPairPrice, COINPAIR_NAME, ORACLE_FEES, oracles);
    });

    it('getCoinPairUIInfo', async function () {
        const result = await infoGetter.read.getCoinPairUIInfo([coinPairPrice.address]);
        expect(result.round).to.not.be.undefined;
        expect(result.startBlock).to.not.be.undefined;
        expect(result.lockPeriodTimestamp).to.not.be.undefined;
        expect(result.totalPoints).to.not.be.undefined;
        expect(result.info).to.not.be.undefined;
        expect(result.currentBlock).to.not.be.undefined;
        expect(result.lastPubBlock).to.not.be.undefined;
        expect(result.lastPubBlockHash).to.not.be.undefined;
        expect(result.validPricePeriodInBlocks).to.not.be.undefined;
        expect(result.availableRewards).to.not.be.undefined;
    });

    it('getManagerUICoinPairInfo', async function () {
        const result = await infoGetter.read.getManagerUICoinPairInfo([
            contracts.oracleMgr.address,
            0n,
            1n,
        ]);
        expect(result).to.not.be.undefined;
        expect(result.length).to.equal(1);
        expect(result[0].addr).to.not.be.undefined;
        expect(result[0].coinPair).to.not.be.undefined;

        await infoGetter.read.getManagerUICoinPairInfo([contracts.oracleMgr.address, 1000n, 1000n]);
    });

    it('getManagerUIOracleInfo', async function () {
        const [info, nextEntry] = await infoGetter.read.getManagerUIOracleInfo([
            contracts.oracleMgr.address,
            0n,
            1n,
        ]);
        expect(info).to.not.be.undefined;
        expect(nextEntry).to.not.be.undefined;
        expect(info.length).to.equal(1);
        expect(info[0].stake).to.not.be.undefined;
        expect(info[0].mocsBalance).to.not.be.undefined;
        expect(info[0].basecoinBalance).to.not.be.undefined;
        expect(info[0].addr).to.not.be.undefined;
        expect(info[0].owner).to.not.be.undefined;
        expect(info[0].name).to.not.be.undefined;

        await infoGetter.read.getManagerUIOracleInfo([contracts.oracleMgr.address, 0n, 1000n]);
        await infoGetter.read.getManagerUIOracleInfo([contracts.oracleMgr.address, 1000n, 1000n]);
    });

    it('getOracleServerInfo', async function () {
        const result = await infoGetter.read.getOracleServerInfo([
            contracts.oracleMgr.address,
            coinPairPrice.address,
        ]);
        expect(result).to.not.be.undefined;
        expect(result.round).to.not.be.undefined;
        expect(result.startBlock).to.not.be.undefined;
        expect(result.lockPeriodTimestamp).to.not.be.undefined;
        expect(result.totalPoints).to.not.be.undefined;
        expect(result.info).to.not.be.undefined;
        expect(result.price).to.not.be.undefined;
        expect(result.currentBlock).to.not.be.undefined;
        expect(result.lastPubBlock).to.not.be.undefined;
        expect(result.lastPubBlockHash).to.not.be.undefined;
        expect(result.validPricePeriodInBlocks).to.not.be.undefined;
    });
});
