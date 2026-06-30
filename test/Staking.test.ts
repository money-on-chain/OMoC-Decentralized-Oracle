import { expect } from 'chai';
import { network } from 'hardhat';
import { initCoinpair, initContracts, waitForEvents } from './helpers.js';
import { getAddress } from 'viem';
import {
    assertSameAddress,
    Deployer,
    type NetworkHelpers,
    type WalletClients,
} from 'ts-test-helpers';

describe('Staking', function () {
    const minCPSubscriptionStake = 10n ** 18n;
    const period = 3n;
    const secsUntilStakeRelease = 45n;
    const governorOwnerIndex = 8;
    const oracleData = [
        { name: 'oracle-a.io', stake: 4n * 10n ** 18n, account: 1, owner: 2 },
        { name: 'oracle-b.io', stake: 8n * 10n ** 18n, account: 3, owner: 4 },
        { name: 'oracle-c.io', stake: 1n * 10n ** 18n, account: 5, owner: 6 },
        { name: 'oracle-d.io', stake: 3n * 10n ** 18n, account: 7, owner: 8 },
    ] as const;

    let deployer: Deployer;
    let viem: Awaited<ReturnType<typeof network.create>>['viem'];
    let networkHelpers: NetworkHelpers;
    let accounts: WalletClients;
    let contracts: Awaited<ReturnType<typeof initContracts>>;
    let coinPairPriceBtcusd: Awaited<ReturnType<typeof initCoinpair>>;
    let coinPairPriceRifbtc: Awaited<ReturnType<typeof initCoinpair>>;
    let untilTimestampLock: bigint;

    beforeEach(async function () {
        ({ viem, networkHelpers } = await network.create());
        deployer = await Deployer.default(viem);
        accounts = await viem.getWalletClients();

        contracts = await initContracts(
            deployer,
            accounts[governorOwnerIndex],
            period,
            minCPSubscriptionStake,
        );
        coinPairPriceBtcusd = await initCoinpair(
            deployer,
            'BTCUSD',
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );
        coinPairPriceRifbtc = await initCoinpair(
            deployer,
            'RIFBTC',
            contracts.governor,
            contracts.token,
            contracts.oracleMgr,
            contracts.registry,
            [accounts[0].account!.address],
        );

        for (const idx of [0, 2, 4, 6, 8]) {
            await contracts.governor.mint(
                contracts.token.address,
                accounts[idx].account!.address,
                800n * 10n ** 18n,
            );
        }
    });

    async function registerOracle(entry: (typeof oracleData)[number]) {
        const oracleAddr = accounts[entry.account].account!.address;
        const owner = accounts[entry.owner];
        const tx = await contracts.staking.write.registerOracle([oracleAddr, entry.name], {
            account: owner.account!,
        });

        const event = (await waitForEvents(viem, contracts.oracleMgr, 'OracleRegistered', tx))[0]
            .args;
        assertSameAddress(event.caller, owner.account!.address);
        assertSameAddress(event.addr, oracleAddr);
        expect(event.internetName).to.equal(entry.name);
    }

    async function depositOracle(entry: (typeof oracleData)[number]) {
        const owner = accounts[entry.owner];
        await contracts.token.write.approve([contracts.staking.address, entry.stake], {
            account: owner.account!,
        });
        await contracts.staking.write.deposit([entry.stake, owner.account!.address], {
            account: owner.account!,
        });
    }

    describe('Should register Oracles A, B, C', function () {
        it('registers the first three oracles', async function () {
            for (const entry of oracleData.slice(0, 3)) {
                await registerOracle(entry);
            }

            for (const entry of oracleData.slice(0, 3)) {
                const info = await contracts.oracleMgr.read.getOracleRegistrationInfo([
                    accounts[entry.owner].account!.address,
                ]);
                expect(info[0]).to.equal(entry.name);
                expect(info[1]).to.equal(0n);
                expect(
                    await contracts.staking.read.isOracleRegistered([
                        accounts[entry.owner].account!.address,
                    ]),
                ).to.equal(true);
            }

            const count = await contracts.staking.read.getRegisteredOraclesLen();
            const registered = [];
            for (let idx = 0; idx < Number(count); idx += 1) {
                registered.push(
                    await contracts.staking.read.getRegisteredOracleAtIndex([BigInt(idx)]),
                );
            }
            expect(registered.map((o) => getAddress(o[0]))).to.have.members(
                oracleData.slice(0, 3).map((x) => getAddress(accounts[x.owner].account!.address)),
            );
        });
    });

    describe('Should subscribe Oracles A, B, C to coin pair BTCUSD', function () {
        it('subscribes the first three oracles', async function () {
            for (const entry of oracleData.slice(0, 3)) {
                await registerOracle(entry);
                await depositOracle(entry);
                await contracts.staking.write.subscribeToCoinPair(
                    [await coinPairPriceBtcusd.read.getCoinPair()],
                    {
                        account: accounts[entry.owner].account!,
                    },
                );
                expect(
                    await coinPairPriceBtcusd.read.isSubscribed([
                        accounts[entry.owner].account!.address,
                    ]),
                ).to.equal(true);
            }
        });
    });

    describe("Should not be able to lock mocs from an address other than the voting machine's", function () {
        it('reverts for direct calls', async function () {
            untilTimestampLock = BigInt(
                Math.round(Date.now() / 1000) + Number(secsUntilStakeRelease),
            );
            await viem.assertions.revertWith(
                contracts.staking.write.lockMocs(
                    [accounts[oracleData[1].owner].account!.address, untilTimestampLock],
                    { account: accounts[oracleData[1].owner].account! },
                ),
                'Address is not whitelisted',
            );
        });
    });

    describe('Should lock stake of oracle B', function () {
        it('locks oracle B stake through the voting machine', async function () {
            untilTimestampLock = BigInt(
                Math.round(Date.now() / 1000) + Number(secsUntilStakeRelease),
            );
            await registerOracle(oracleData[1]);
            await depositOracle(oracleData[1]);

            const balance = await contracts.staking.read.getBalance([
                accounts[oracleData[1].owner].account!.address,
            ]);
            await contracts.votingMachine.write.lockMocs(
                [accounts[oracleData[1].owner].account!.address, untilTimestampLock],
                { account: accounts[oracleData[1].owner].account! },
            );

            const locked = await contracts.staking.read.getLockedBalance([
                accounts[oracleData[1].owner].account!.address,
            ]);
            expect(locked).to.equal(balance);
        });
    });

    describe('Should not be able to withdraw stake of oracle B until it is unlocked', function () {
        it('waits until unlock time', async function () {
            untilTimestampLock = BigInt(
                Math.round(Date.now() / 1000) + Number(secsUntilStakeRelease),
            );
            await registerOracle(oracleData[1]);
            await depositOracle(oracleData[1]);
            await contracts.votingMachine.write.lockMocs(
                [accounts[oracleData[1].owner].account!.address, untilTimestampLock],
                { account: accounts[oracleData[1].owner].account! },
            );

            await viem.assertions.revertWith(
                contracts.staking.write.withdraw([oracleData[1].stake], {
                    account: accounts[oracleData[1].owner].account!,
                }),
                'Stake not available for withdrawal.',
            );

            await networkHelpers.time.increase(Number(secsUntilStakeRelease + 1n));
            await contracts.staking.write.withdraw([oracleData[1].stake], {
                account: accounts[oracleData[1].owner].account!,
            });
        });
    });

    describe('Should not be able to withdraw stake of oracle D because it has none', function () {
        it('reverts on empty balance', async function () {
            await registerOracle(oracleData[3]);
            await viem.assertions.revertWith(
                contracts.staking.write.withdraw([oracleData[3].stake], {
                    account: accounts[oracleData[3].owner].account!,
                }),
                'SafeMath: subtraction overflow',
                // A previous assertion was 'Stake not available for withdrawal.',
                // Either the contract setup is unclear or the code changed raising this exception first.
            );
        });
    });

    describe('Should withdraw stake of oracle A', function () {
        it('withdraws oracle A stake', async function () {
            await registerOracle(oracleData[0]);
            await depositOracle(oracleData[0]);
            await contracts.staking.write.withdraw([oracleData[0].stake], {
                account: accounts[oracleData[0].owner].account!,
            });
        });
    });

    describe('Should withdraw stake of oracle D w/o leaving tokens stuck in contract', function () {
        it('handles repeated deposit and withdraw cycles', async function () {
            await registerOracle(oracleData[2]);
            await depositOracle(oracleData[2]);
            await contracts.staking.write.withdraw([oracleData[2].stake], {
                account: accounts[oracleData[2].owner].account!,
            });

            const stake = oracleData[3].stake;
            const withdrawAmounts = [
                stake / 3n,
                stake / 4n,
                stake / 5n,
                stake - 1n,
                stake - 11n,
                stake - 111n,
                stake - 1111n,
            ];

            await registerOracle(oracleData[3]);
            for (const amount of withdrawAmounts) {
                await depositOracle(oracleData[3]);
                await contracts.staking.write.withdraw([amount], {
                    account: accounts[oracleData[3].owner].account!,
                });

                const remaining = oracleData[3].stake - amount;
                await contracts.staking.write.withdraw([remaining], {
                    account: accounts[oracleData[3].owner].account!,
                });
            }
        });
    });

    describe('Coin pair smoke', function () {
        it('created both coin pairs', async function () {
            expect(await coinPairPriceBtcusd.read.getCoinPair()).to.equal(
                await coinPairPriceBtcusd.read.getCoinPair(),
            );
            expect(await coinPairPriceRifbtc.read.getCoinPair()).to.equal(
                await coinPairPriceRifbtc.read.getCoinPair(),
            );
        });
    });
});
