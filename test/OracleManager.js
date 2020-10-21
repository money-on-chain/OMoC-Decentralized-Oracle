const helpers = require('./helpers');
const {constants, expectRevert, BN} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract('OracleManager', async (accounts) => {
    const WHITELISTED_CALLER = accounts[9];
    const GOVERNOR_OWNER = accounts[10];
    const MIN_ORACLE_STAKE = (10 ** 18).toString();
    /* Account is the simulated oracle server address. The stake 
       will come from the owner's address. */

    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: GOVERNOR_OWNER,
            oracleManagerWhitelisted: [WHITELISTED_CALLER],
            minSubscriptionStake: MIN_ORACLE_STAKE,
        });
        Object.assign(this, contracts);
        this.coinPair = web3.utils.asciiToHex('BTCUSD');
        this.coinPairPrice_btcusd = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        this.coinPair2 = web3.utils.asciiToHex('RIFBTC');
        this.coinPairPrice_RIFBTC = await helpers.initCoinpair('RIFBTC', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
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

    // const oracleDataPair = oracleData
    //     .map((x, idx) => [idx, x])
    //     .sort((a, b) => new BN(a[1].account).cmp(new BN(b[1].account)));

    it('Should register Oracles A, B, C', async () => {
        await this.oracleMgr.registerOracle(
            oracleData[0].owner,
            oracleData[0].account,
            oracleData[0].name,
            {
                from: WHITELISTED_CALLER,
            },
        );
        await this.oracleMgr.registerOracle(
            oracleData[1].owner,
            oracleData[1].account,
            oracleData[1].name,
            {
                from: WHITELISTED_CALLER,
            },
        );
        await this.oracleMgr.registerOracle(
            oracleData[2].owner,
            oracleData[2].account,
            oracleData[2].name,
            {
                from: WHITELISTED_CALLER,
            },
        );

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner);
        assert.equal(info0.internetName, oracleData[0].name);

        const info1 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[1].owner);
        assert.equal(info1.internetName, oracleData[1].name);

        const info2 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[2].owner);
        assert.equal(info2.internetName, oracleData[2].name);

        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].owner));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[1].owner));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[2].owner));
    });

    it("Should fail to register Oracle from Oracle Manager calling from an address other than the Staking contract's", async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(
                oracleData[0].owner,
                oracleData[0].account,
                oracleData[0].name,
                {
                    from: oracleData[0].owner,
                },
            ),
            'Address is not whitelisted',
        );
    });

    it('Should fail to register Oracle with null address as oracle address', async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(
                constants.ZERO_ADDRESS,
                constants.ZERO_ADDRESS,
                'mock.io',
                {
                    from: WHITELISTED_CALLER,
                },
            ),
            'Owner address cannot be 0x0',
        );
    });

    it('Should fail to register an Oracle twice', async () => {
        await expectRevert(
            this.oracleMgr.registerOracle(
                oracleData[0].owner,
                oracleData[0].account,
                oracleData[0].name,
                {
                    from: WHITELISTED_CALLER,
                },
            ),
            'Owner already registered',
        );
    });

    it('Should subscribe oracle A to coin-pair USDBTC', async () => {
        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });
        await this.oracleMgr.subscribeToCoinPair(oracleData[0].owner, this.coinPair, {
            from: WHITELISTED_CALLER,
        });
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].owner));
    });

    it('Should fail to subscribe oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.subscribeToCoinPair(oracleData[0].account, this.coinPair, {
                from: WHITELISTED_CALLER,
            }),
            'Oracle not registered',
        );
    });

    it('Should fail to unsubscribe oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.unSubscribeFromCoinPair(oracleData[0].account, this.coinPair, {
                from: WHITELISTED_CALLER,
            }),
            'Oracle not registered',
        );
    });

    it('Should fail to subscribe oracle if already subscribed', async () => {
        await expectRevert(
            this.oracleMgr.subscribeToCoinPair(oracleData[0].owner, this.coinPair, {
                from: WHITELISTED_CALLER,
            }),
            'Oracle is already subscribed to this coin pair',
        );
    });

    it('Should subscribe oracle B to both coin-pairs', async () => {
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });
        await this.oracleMgr.subscribeToCoinPair(oracleData[1].owner, this.coinPair, {
            from: WHITELISTED_CALLER,
        });
        await this.oracleMgr.subscribeToCoinPair(oracleData[1].owner, this.coinPair2, {
            from: WHITELISTED_CALLER,
        });
        assert.isTrue(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].owner));
        assert.isTrue(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[1].owner));
        assert.isFalse(await this.coinPairPrice_RIFBTC.isSubscribed(oracleData[2].owner));
        assert.isFalse(await this.coinPairPrice_btcusd.isSubscribed(oracleData[2].owner));
    });

    it('Should unsubscribe oracle A from coin-pair USDBTC', async () => {
        await this.oracleMgr.unSubscribeFromCoinPair(oracleData[0].owner, this.coinPair, {
            from: WHITELISTED_CALLER,
        });
        assert.isFalse(await this.coinPairPrice_btcusd.isSubscribed(oracleData[0].account));
    });

    it('Should fail to unsubscribe oracle if not subscribed', async () => {
        await expectRevert(
            this.oracleMgr.unSubscribeFromCoinPair(oracleData[0].owner, this.coinPair, {
                from: WHITELISTED_CALLER,
            }),
            'Oracle is not subscribed to this coin pair',
        );
    });

    it('Should reject to change name of unregistered oracle', async () => {
        const randomAddr = ethers.utils.hexlify(ethers.utils.randomBytes(20));
        await expectRevert(
            this.oracleMgr.setOracleName(randomAddr, 'X', {from: WHITELISTED_CALLER}),
            'Oracle not registered',
        );
    });

    it('Should reject to change name of oracle if called by non-owner', async () => {
        await expectRevert(
            this.oracleMgr.setOracleName(oracleData[0].account, 'XYZ', {from: WHITELISTED_CALLER}),
            'Oracle not registered',
        );
    });

    it('Should change name of oracle A if requested by owner', async () => {
        const newName = 'oracle-coinfabrik.ar';

        await this.oracleMgr.setOracleName(oracleData[0].owner, newName, {
            from: WHITELISTED_CALLER,
        });
        assert.equal(
            (await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner)).internetName,
            newName,
        );
    });

    it('Should fail to remove an oracle if is not registered', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[3].owner, {from: WHITELISTED_CALLER}),
            'Oracle not registered',
        );
    });

    it('Should fail to remove an oracle if called from non-owner', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[0].account, {from: WHITELISTED_CALLER}),
            'Oracle not registered',
        );
    });

    it('Should remove an oracle A', async () => {
        assert.isTrue(await this.oracleMgr.canRemoveOracle(oracleData[0].owner));
        await this.oracleMgr.removeOracle(oracleData[0].owner, {from: WHITELISTED_CALLER});
        assert.isFalse(await this.oracleMgr.isRegistered(oracleData[0].owner));
    });

    it('Should be able to remove an oracle', async () => {
        // Unsubscribe from all coinpairs to remove
        assert.isFalse(await this.oracleMgr.canRemoveOracle(oracleData[1].owner));

        await this.oracleMgr.unSubscribeFromCoinPair(oracleData[1].owner, this.coinPair, {
            from: WHITELISTED_CALLER,
        });

        assert.isFalse(await this.oracleMgr.canRemoveOracle(oracleData[1].owner));

        await this.oracleMgr.unSubscribeFromCoinPair(oracleData[1].owner, this.coinPair2, {
            from: WHITELISTED_CALLER,
        });

        assert.isTrue(await this.oracleMgr.canRemoveOracle(oracleData[1].owner));
        assert.isTrue(await this.oracleMgr.isRegistered(oracleData[1].owner));
        await this.oracleMgr.removeOracle(oracleData[1].owner, {from: WHITELISTED_CALLER});
        assert.isFalse(await this.oracleMgr.isRegistered(oracleData[1].owner));
    });
});
