const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');

contract('Staking', async (accounts) => {
    const minCPSubscriptionStake = (10 ** 18).toString();
    const period = 3;
    const secsUntilStakeRelease = 45;
    let untilTimestampLock;

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: accounts[8],
            period,
            minSubscriptionStake: minCPSubscriptionStake,
        });
        Object.assign(this, contracts);

        this.coinPairPrice_BTCUSD = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[8], '800000000000000000000');
    });

    const oracleData = [
        {
            name: 'oracle-a.io',
            stake: (4 * 10 ** 18).toString(),
            account: accounts[1],
            owner: accounts[2],
        },
        {
            name: 'oracle-b.io',
            stake: (8 * 10 ** 18).toString(),
            account: accounts[3],
            owner: accounts[4],
        },
        {
            name: 'oracle-c.io',
            stake: (1 * 10 ** 18).toString(),
            account: accounts[5],
            owner: accounts[6],
        },
        {
            name: 'oracle-d.io',
            stake: (3 * 10 ** 18).toString(),
            account: accounts[7],
            owner: accounts[8],
        },
    ];

    it('Should register Oracles A, B, C', async () => {
        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
            from: oracleData[2].owner,
        });

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner);
        assert.equal(info0.internetName, oracleData[0].name);
        assert.equal(info0.stake, 0);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].owner);
        assert.equal(info1.internetName, oracleData[1].name);
        assert.equal(info1.stake, 0);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].owner);
        assert.equal(info2.internetName, oracleData[2].name);
        assert.equal(info2.stake, 0);
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[0].owner));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[1].owner));
        assert.isTrue(await this.staking.isOracleRegistered(oracleData[2].owner));

        const cant = await this.staking.getRegisteredOraclesLen();
        const oracles = [];
        for (let idx = 0; idx < cant; idx++) {
            oracles.push(await this.staking.getRegisteredOracleAtIndex(idx));
        }
        expect(oracles.map((x) => x.ownerAddr)).to.have.same.members(
            oracleData.slice(0, 3).map((x) => x.owner),
        );
    });

    it('Should deposit stake for Oracle A, B', async () => {
        const prevBalance0 = await this.token.balanceOf(oracleData[0].owner);
        const prevBalance1 = await this.token.balanceOf(oracleData[1].owner);

        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });

        assert.isTrue(
            (await this.token.balanceOf(oracleData[0].owner)).eq(
                prevBalance0.sub(new BN(oracleData[0].stake)),
            ),
        );
        assert.isTrue(
            (await this.token.balanceOf(oracleData[1].owner)).eq(
                prevBalance1.sub(new BN(oracleData[1].stake)),
            ),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[0].owner)).eq(new BN(oracleData[0].stake)),
        );
        assert.isTrue(
            (await this.staking.getBalance(oracleData[1].owner)).eq(new BN(oracleData[1].stake)),
        );
    });

    it('Should subscribe Oracles A, B, C to coin pair BTCUSD', async () => {
        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[0].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[0].owner));

        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[1].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[1].owner));

        await this.staking.subscribeToCoinPair(web3.utils.asciiToHex('BTCUSD'), {
            from: oracleData[2].owner,
        });
        assert.isTrue(await this.coinPairPrice_BTCUSD.isSubscribed(oracleData[2].owner));
    });

    it("Should not be able to lock mocs from an address other than the voting machine's", async () => {
        untilTimestampLock = Math.round(Date.now() / 1000) + secsUntilStakeRelease;
        await expectRevert(
            this.staking.lockMocs(oracleData[1].owner, new BN(untilTimestampLock), {
                from: oracleData[1].owner,
            }),
            'Address is not whitelisted',
        );
    });

    it('Should lock stake of oracle B', async () => {
        untilTimestampLock = Math.round(Date.now() / 1000) + secsUntilStakeRelease;
        const balance = await this.staking.getBalance(oracleData[1].owner);
        await this.votingMachine.lockMocs(oracleData[1].owner, new BN(untilTimestampLock), {
            from: oracleData[1].owner,
        });
        const locked = await this.staking.getLockedBalance(oracleData[1].owner);
        expect(locked).to.be.bignumber.equal(balance);
    });

    // Slow test. Comment to test the others faster.
    it('Should not be able to withdraw stake of oracle B until it is unlocked', async () => {
        let currentTimestamp = await time.latest();
        while (currentTimestamp < untilTimestampLock) {
            await expectRevert(
                this.staking.withdraw(oracleData[1].stake, {from: oracleData[1].owner}),
                'Stake not available for withdrawal.',
            );
            await helpers.mineBlocks(1);
            currentTimestamp = await time.latest();
        }
        await this.staking.withdraw(oracleData[1].stake, {from: oracleData[1].owner});
    });

    it('Should not be able to withdraw stake of oracle D because it has none', async () => {
        await expectRevert(
            this.staking.withdraw(oracleData[3].stake, {from: oracleData[3].owner}),
            'Stake not available for withdrawal.',
        );
    });

    it('Should withdraw stake of oracle A', async () => {
        await this.staking.withdraw(oracleData[0].stake, {from: oracleData[0].owner});
    });

    it('Should withdraw stake of oracle D w/o leaving tokens stuck in contract', async () => {
        const withdrawAmounts = [
            (parseInt(oracleData[3].stake, 10) / 2).toString(),
            (parseInt(oracleData[3].stake, 10) / 3).toString(),
            (parseInt(oracleData[3].stake, 10) / 4).toString(),
            (parseInt(oracleData[3].stake, 10) / 5).toString(),
            (parseInt(oracleData[3].stake, 10) - 1).toString(),
            (parseInt(oracleData[3].stake, 10) - 11).toString(),
            (parseInt(oracleData[3].stake, 10) - 111).toString(),
            (parseInt(oracleData[3].stake, 10) - 1111).toString(),
        ];
        for (let i = 0; i < withdrawAmounts.length; i++) {
            // Previous approve for deposit in Staking
            await this.token.approve(this.staking.address, oracleData[3].stake, {
                from: oracleData[3].owner,
            });
            // Deposit mocs in StakingMock
            await this.staking.deposit(oracleData[3].stake, oracleData[3].owner, {
                from: oracleData[3].owner,
            });
            // Check the owner's stake in mocs was deposited
            assert.isTrue(
                (await this.staking.getBalance(oracleData[3].owner)).eq(
                    new BN(oracleData[3].stake),
                ),
            );
            // Withdraw an amount of stake taken from the list
            await this.staking.withdraw(withdrawAmounts[i], {from: oracleData[3].owner});
            // Check the owner's stake balance in mocs was reduced accordingly
            const balanceAfterWithdraw = new BN(oracleData[3].stake).sub(
                new BN(withdrawAmounts[i]),
            );
            assert.isTrue(
                (await this.staking.getBalance(oracleData[3].owner)).eq(balanceAfterWithdraw),
            );
            // Withdraw the rest of the stake to reset it
            await this.staking.withdraw(balanceAfterWithdraw, {from: oracleData[3].owner});
            // Check the owner's moc and internal token balances are 0.
            assert.isTrue((await this.staking.getBalance(oracleData[3].owner)).eq(new BN(0)));
            assert.isTrue(
                (await this.stakingMock.getBalanceInTokens(oracleData[3].owner)).eq(new BN(0)),
            );
        }
    });
});
