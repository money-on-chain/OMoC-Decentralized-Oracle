import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts, OracleDefinition, publishPrice } from './helpers.js';

import { Deployer, Viem, WalletClients } from 'ts-test-helpers';

describe('CoinPairPriceFree', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;

    const ORACLE_STAKE = 10n ** 18n;
    const COINPAIR_NAME = 'BTCUSD';

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
    });

    it('coinPairPriceFree', async function () {
        const governorOwner = accounts[8];
        const contracts = await initContracts(deployer, governorOwner);
        const coinPairPriceFree = await deployer.deployUninitializedProxy('CoinPairPriceFree');
        const coinPairPrice = await initCoinpair(
            deployer,
            COINPAIR_NAME,
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address, coinPairPriceFree.address],
            3n,
            3n,
        );

        coinPairPriceFree.write.initialize([coinPairPrice.address]);

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

        for (const { address, name, owner } of oracles) {
            const args = { account: owner.account };
            await contracts.governor.mint(
                contracts.token.address,
                owner.account!.address,
                ORACLE_STAKE,
            );
            await contracts.token.write.approve([contracts.staking.address, ORACLE_STAKE], args);
            await contracts.staking.write.registerOracle([address, name], args);
            await contracts.staking.write.deposit([ORACLE_STAKE, owner.account!.address], args);
            await contracts.staking.write.subscribeToCoinPair([coinPairId], args);
        }

        await coinPairPrice.write.switchRound();

        const price = 10n ** 18n;
        await publishPrice(coinPairPrice, COINPAIR_NAME, price, oracles);

        const pubAccount = { account: accounts[9].account };
        await viem.assertions.revertWith(
            coinPairPrice.read.peek(pubAccount),
            'Address is not whitelisted',
        );

        const peek = await coinPairPriceFree.read.peek(pubAccount);
        expect(peek[1]).to.equal(true);
        expect(BigInt(peek[0])).to.equal(price);

        expect(await coinPairPriceFree.read.getPrice(pubAccount)).to.equal(price);
        expect(await coinPairPriceFree.read.getIsValid(pubAccount)).to.equal(true);

        const lastPublicationBlock = await coinPairPrice.read.getLastPublicationBlock();

        expect(await coinPairPriceFree.read.getLastPublicationBlock(pubAccount)).to.equal(
            lastPublicationBlock,
        );

        const info = await coinPairPriceFree.read.getPriceInfo(pubAccount);
        expect(info[0]).to.equal(price);
        expect(info[1]).to.equal(true);
        expect(info[2]).to.equal(lastPublicationBlock);
    });
});
