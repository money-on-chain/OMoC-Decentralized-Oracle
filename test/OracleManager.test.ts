import { expect } from 'chai';
import { network } from 'hardhat';
import { Account, bytesToHex, getAddress, parseEther, stringToHex } from 'viem';
import { initContractsWithCoinPairs, OracleStakeData, ADDRESS_ZERO } from './helpers.js';
import {
    Deployer,
    WalletClient,
    type ContractOf,
    type Viem,
    type WalletClients,
} from 'ts-test-helpers';

describe('OracleManager', function () {
    let viem: Viem;
    let deployer: Deployer;
    let accounts: WalletClients;
    let caller: { account: Account };
    let governorOwner: WalletClient;
    let contracts: Awaited<ReturnType<typeof initContractsWithCoinPairs>>;
    let oracleMgr: ContractOf<'OracleManager'>;
    let oracleData: OracleStakeData[];
    const minOracleStake = 10n ** 18n;
    const coinPair = stringToHex('BTCUSD', { size: 32 });
    const coinPair2 = stringToHex('RIFBTC', { size: 32 });

    /* Account is the simulated oracle server address. The stake
       will come from the owner's address. */

    before(async () => {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();
        const whitelisted = accounts[9].account!;
        caller = { account: whitelisted };
        governorOwner = accounts[10];
        contracts = await initContractsWithCoinPairs(
            deployer,
            governorOwner,
            undefined,
            minOracleStake,
            [accounts[0].account.address, whitelisted.address],
        );
        oracleMgr = contracts.oracleMgr;

        for (const i of [0, 2, 4, 6]) {
            await contracts.governor.mint(
                contracts.token.address,
                accounts[i].account!.address,
                parseEther('800'),
            );
        }
        oracleData = [
            {
                name: 'oracle-a.io',
                stake: 4n * 10n ** 18n,
                account: accounts[1],
                owner: accounts[2],
                address: accounts[1].account!.address,
            },
            {
                name: 'oracle-b.io',
                stake: 8n * 10n ** 18n,
                account: accounts[3],
                owner: accounts[4],
                address: accounts[3].account!.address,
            },
            {
                name: 'oracle-c.io',
                stake: 1n * 10n ** 18n,
                account: accounts[5],
                owner: accounts[6],
                address: accounts[5].account!.address,
            },
            {
                name: 'oracle-d.io',
                stake: 3n * 10n ** 18n,
                account: accounts[7],
                owner: accounts[8],
                address: accounts[7].account!.address,
            },
        ];
    });

    it('Should register Oracles A, B, C', async () => {
        for (const o of oracleData.slice(0, 3)) {
            const ownerAddr = o.owner.account!.address;
            await oracleMgr.write.registerOracle([ownerAddr, o.address, o.name], caller);
            const [name] = await oracleMgr.read.getOracleRegistrationInfo([ownerAddr]);
            expect(name).to.eq(o.name);
            expect(await oracleMgr.read.isOracleRegistered([ownerAddr])).to.be.true;
        }
    });

    it("Should fail to register Oracle from Oracle Manager calling from an address other than the Staking contract's", async () => {
        const o = oracleData[0];
        await viem.assertions.revertWith(
            oracleMgr.write.registerOracle([o.owner.account!.address, o.address, o.name], {
                account: o.owner.account!,
            }),
            'Address is not whitelisted',
        );
    });

    it('Should fail to register Oracle with null address as oracle address', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.registerOracle([ADDRESS_ZERO, ADDRESS_ZERO, 'mock.io'], caller),
            'Owner address cannot be 0x0',
        );
    });

    it('Should fail to register an Oracle twice', async () => {
        const o = oracleData[0];
        await viem.assertions.revertWith(
            oracleMgr.write.registerOracle([o.owner.account!.address, o.address, o.name], caller),
            'Owner already registered',
        );
    });

    it('Should subscribe oracle A to coin-pair USDBTC', async () => {
        const o = oracleData[0];
        const ownerAcc = o.owner.account!;
        await contracts.token.write.approve([contracts.staking.address, o.stake], {
            account: ownerAcc,
        });
        await contracts.staking.write.deposit([o.stake, ownerAcc.address], {
            account: ownerAcc,
        });
        await oracleMgr.write.subscribeToCoinPair([ownerAcc.address, coinPair], caller);

        expect(await contracts.coinPairPriceBTCUSD.read.isSubscribed([ownerAcc.address])).to.be
            .true;
    });

    it('Should fail to subscribe oracle if not called by owner', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.subscribeToCoinPair(
                [oracleData[0].account.account!.address, coinPair],
                caller,
            ),
            'Oracle not registered',
        );
    });

    it('Should fail to unsubscribe oracle if not called by owner', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.unSubscribeFromCoinPair(
                [oracleData[0].account.account!.address, coinPair],
                caller,
            ),
            'Oracle not registered',
        );
    });

    it('Should fail to subscribe oracle if already subscribed', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.subscribeToCoinPair(
                [oracleData[0].owner.account!.address, coinPair],
                caller,
            ),
            'Oracle is already subscribed to this coin pair',
        );
    });

    it('Should subscribe oracle B to both coin-pairs', async () => {
        const oracleB = oracleData[1];
        const accountB = oracleB.owner.account!;
        const addressB = accountB.address;

        const oracleC = oracleData[2];
        const accountC = oracleC.owner.account!;
        const addressC = accountC.address;

        await contracts.token.write.approve([contracts.staking.address, oracleB.stake], {
            account: accountB,
        });
        await contracts.staking.write.deposit([oracleB.stake, addressB], {
            account: accountB,
        });
        await oracleMgr.write.subscribeToCoinPair([addressB, coinPair], caller);
        await oracleMgr.write.subscribeToCoinPair([addressB, coinPair2], caller);
        expect(await contracts.coinPairPriceBTCUSD.read.isSubscribed([addressB])).to.be.true;

        expect(await contracts.coinPairPriceRIFBTC.read.isSubscribed([addressB])).to.be.true;

        expect(await contracts.coinPairPriceBTCUSD.read.isSubscribed([addressC])).to.be.false;

        expect(await contracts.coinPairPriceRIFBTC.read.isSubscribed([addressC])).to.be.false;

        await contracts.token.write.approve([contracts.staking.address, oracleC.stake], {
            account: accountC,
        });
        await contracts.staking.write.deposit([oracleC.stake, addressC], {
            account: accountC,
        });
        await oracleMgr.write.subscribeToCoinPair([addressC, coinPair2], caller);
        expect(await contracts.coinPairPriceRIFBTC.read.isSubscribed([addressC])).to.be.true;
    });

    it('Should unsubscribe oracle A from coin-pair USDBTC', async () => {
        const addr = oracleData[0].owner.account!.address;
        await oracleMgr.write.unSubscribeFromCoinPair([addr, coinPair], caller);
        expect(await contracts.coinPairPriceBTCUSD.read.isSubscribed([addr])).to.be.false;
    });

    it('Should fail to unsubscribe oracle if not subscribed', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.unSubscribeFromCoinPair(
                [oracleData[0].owner.account!.address, coinPair],
                caller,
            ),
            'Oracle is not subscribed to this coin pair',
        );
    });

    it('Should reject to change name of unregistered oracle', async () => {
        const randomAddr = getAddress(bytesToHex(crypto.getRandomValues(new Uint8Array(20))));

        await viem.assertions.revertWith(
            oracleMgr.write.setOracleName([randomAddr, 'X'], caller),
            'Oracle not registered',
        );
    });

    it('Should reject to change name of oracle if called by non-owner', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.setOracleName([oracleData[0].address, 'XYZ'], caller),
            'Oracle not registered',
        );
    });

    it('Should change name of oracle A if requested by owner', async () => {
        const newName = 'oracle-bogus.ar';
        const address = oracleData[0].owner.account!.address;

        await oracleMgr.write.setOracleName([address, newName], caller);
        const [name] = await oracleMgr.read.getOracleRegistrationInfo([address]);
        expect(name).to.eq(newName);
    });

    it('Should fail to remove an oracle if is not registered', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.removeOracle([oracleData[3].owner.account!.address], caller),
            'Oracle not registered',
        );
    });

    it('Should fail to remove an oracle if called from non-owner', async () => {
        await viem.assertions.revertWith(
            oracleMgr.write.removeOracle([oracleData[3].owner.account!.address], caller),
            'Oracle not registered',
        );
    });

    it('Should fail to remove an oracle if it is in a current round', async () => {
        const address = oracleData[0].owner.account!.address;
        expect(await oracleMgr.read.isRegistered([address])).to.be.true;
        await viem.assertions.revertWith(
            oracleMgr.write.removeOracle([address], caller),
            'Not ready to remove',
        );
    });

    it('Should remove an oracle A', async () => {
        const account = oracleData[0].owner.account!;
        // We need to withdraw so we get expelled from current round.
        await contracts.staking.write.withdraw([oracleData[0].stake], { account });

        expect(Number(await contracts.staking.read.getBalance([account.address]))).to.eq(0);

        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.true;

        await oracleMgr.write.removeOracle([account.address], caller);
        expect(await oracleMgr.read.isRegistered([account.address])).to.be.false;
    });

    it('Should not be able to remove an unsubscribed oracle if it is in a current round', async () => {
        // Unsubscribe from all coinpairs to remove
        const account = oracleData[2].owner.account!;
        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.false;

        await oracleMgr.write.unSubscribeFromCoinPair([account.address, coinPair2], caller);

        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.false;
    });

    it('Should be able to remove an oracle', async () => {
        // Unsubscribe from all coinpairs to remove
        const account = oracleData[1].owner.account!;

        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.false;

        await oracleMgr.write.unSubscribeFromCoinPair([account.address, coinPair], caller);

        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.false;

        await oracleMgr.write.unSubscribeFromCoinPair([account.address, coinPair2], caller);

        // got unselected
        await contracts.staking.write.withdraw([oracleData[1].stake], { account });

        expect(Number(await contracts.staking.read.getBalance([account.address]))).to.eq(0);

        expect(await oracleMgr.read.canRemoveOracle([account.address])).to.be.true;

        expect(await oracleMgr.read.isRegistered([account.address])).to.be.true;
        await oracleMgr.write.removeOracle([account.address], caller);
        expect(await oracleMgr.read.isRegistered([account.address])).to.be.false;
    });
});
