import assert from 'node:assert/strict';
import { expect } from 'chai';
import { hexToBigInt, parseSignature } from 'viem';
import { network } from 'hardhat';
import { initCoinpair, initContracts, getDefaultEncodedMessage } from './helpers.js';
import { Deployer, Viem, WalletClients } from 'ts-test-helpers';

const feeSourceAccount = 0;

const oracleData = [
    {
        name: 'oracle-a.io',
        stake: 4n * 10n ** 18n,
        account: 1,
        owner: 2,
    },
    {
        name: 'oracle-b.io',
        stake: 8n * 10n ** 18n,
        account: 3,
        owner: 4,
    },
    {
        name: 'oracle-c.io',
        stake: 3n * 10n ** 18n,
        account: 5,
        owner: 6,
    },
    {
        name: 'oracle-d.io',
        stake: 1n * 10n ** 18n,
        account: 7,
        owner: 8,
    },
] as const;

describe('CoinPairPrice', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    async function registerOracle(ownerIdx: number, accountIdx: number, coinPairPrice: any, contracts: any) {
        const owner = accounts[ownerIdx];
        const oracle = accounts[accountIdx];
        const stake = oracleData.find((o) => o.owner === ownerIdx)!.stake;

        await contracts.governor.mint(contracts.token.address, owner.account!.address, 800000000000000000000n);
        await contracts.token.write.approve([contracts.staking.address, stake], { account: owner.account! });
        await contracts.staking.write.registerOracle([oracle.account!.address, oracleData.find((o) => o.account === accountIdx)!.name], { account: owner.account! });
        await contracts.staking.write.deposit([stake, owner.account!.address], { account: owner.account! });
        await contracts.staking.write.subscribeToCoinPair([await coinPairPrice.read.getCoinPair()], { account: owner.account! });
    }

    it('Points are distributed correctly to 4 owners', async function () {
        const contracts = await initContracts(deployer, accounts[8]);
        const coinPairPrice = await initCoinpair(
            deployer,
            'BTCUSD',
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
            4n,
            20n,
            60n,
            0n,
            3n,
        );

        expect(await coinPairPrice.read.getPriceProviderType()).to.equal(1n);
        expect(await coinPairPrice.read.roundLockPeriodSecs()).to.equal(60n);

        for (const entry of oracleData) {
            await contracts.governor.mint(contracts.token.address, accounts[entry.owner].account!.address, entry.stake);
            await contracts.token.write.approve([contracts.staking.address, entry.stake], { account: accounts[entry.owner].account! });
            await contracts.staking.write.registerOracle([accounts[entry.account].account!.address, entry.name], { account: accounts[entry.owner].account! });
            await contracts.staking.write.deposit([entry.stake, accounts[entry.owner].account!.address], { account: accounts[entry.owner].account! });
        }

        const coinPair = await coinPairPrice.read.getCoinPair();
        for (const entry of oracleData) {
            await contracts.staking.write.subscribeToCoinPair([coinPair], { account: accounts[entry.owner].account! });
        }

        const fees = 330000000000000000n;
        const oldFees = await coinPairPrice.read.getAvailableRewardFees();
        await contracts.token.write.transfer([coinPairPrice.address, fees], { account: accounts[feeSourceAccount].account! });
        expect(await coinPairPrice.read.getAvailableRewardFees()).to.equal(oldFees + fees);

        await coinPairPrice.write.switchRound();

        const publish = async () => {
            const { msg, encMsg } = await getDefaultEncodedMessage(
                3,
                'BTCUSD',
                300000000000000000n,
                accounts[0].account!.address,
                await coinPairPrice.read.getLastPublicationBlock(),
            );
            const signatures = await Promise.all(
                [0, 1, 2, 3].map(async (i) =>
                    parseSignature(
                        await accounts[oracleData[i].account].signMessage({
                            account: accounts[oracleData[i].account].account!,
                            message: { raw: encMsg },
                        }),
                    ),
                ),
            );
            await coinPairPrice.write.publishPrice(
                [
                    msg.version,
                    await coinPairPrice.read.getCoinPair(),
                    msg.price,
                    msg.votedOracle,
                    msg.blockNumber,
                    signatures.map((s) => Number(s.v)).reverse(),
                    signatures.map((s) => s.r).reverse(),
                    signatures.map((s) => s.s).reverse(),
                ],
                { account: accounts[0].account! },
            );
        };

        await publish();
        await publish();
        await publish();
        await publish();

        const roundInfo = await coinPairPrice.read.getRoundInfo();
        expect(roundInfo[5].length).to.equal(4);
        assert.ok(roundInfo[5].includes(accounts[1].account!.address));
        assert.ok(roundInfo[5].includes(accounts[3].account!.address));
        assert.ok(roundInfo[5].includes(accounts[5].account!.address));
        assert.ok(roundInfo[5].includes(accounts[7].account!.address));
    });
});
