import { expect } from 'chai';
import { network } from 'hardhat';
import { encodeCoinPair, initContractsWithCoinPairs } from './helpers.js';
import { Deployer } from 'ts-test-helpers';

describe('OracleManagerUnsubscribeChange', function () {
    it('should succeed execute call', async function () {
        const { viem } = await network.create();
        const deployer = await Deployer.default(viem);
        const accounts = await viem.getWalletClients();
        const stake = 10n ** 18n;
        const oracleOwner = accounts[7];
        const oracleAddr = accounts[6].account!.address;
        const contracts = await initContractsWithCoinPairs(deployer, accounts[8], 3n, stake);

        await contracts.governor.mint(
            contracts.token.address,
            oracleOwner.account!.address,
            1800n * 10n ** 18n,
        );

        const change = await deployer.deploy('OracleManagerUnsubscribeChange', [
            contracts.oracleMgr.address,
            oracleOwner.account!.address,
            encodeCoinPair('BTCUSD'),
        ]);

        await contracts.staking.write.registerOracle([oracleAddr, 'url'], {
            account: oracleOwner.account!,
        });
        await contracts.token.write.approve([contracts.staking.address, stake], {
            account: oracleOwner.account!,
        });
        await contracts.staking.write.deposit([stake, oracleOwner.account!.address], {
            account: oracleOwner.account!,
        });
        await contracts.staking.write.subscribeToCoinPair([encodeCoinPair('BTCUSD')], {
            account: oracleOwner.account!,
        });

        expect(
            await contracts.oracleMgr.read.isSubscribed([
                oracleOwner.account!.address,
                encodeCoinPair('BTCUSD'),
            ]),
        ).to.equal(true);

        await contracts.governor.execute(change);

        expect(
            await contracts.oracleMgr.read.isSubscribed([
                oracleOwner.account!.address,
                encodeCoinPair('BTCUSD'),
            ]),
        ).to.equal(false);
    });
});
