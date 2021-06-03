const helpers = require('./helpers');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('OracleManager by gobernanza', async (accounts) => {
    const minOracleOwnerStake = 10 ** 18;
    const period = 20;
    const GOBERNOR = accounts[8];
    const WHITELISTED_CALLER = accounts[9];
    const oracleData = [
        {
            name: 'oracle-a.io',
            stake: (minOracleOwnerStake + 4 * 10 ** 18).toString(),
            account: accounts[1],
            owner: accounts[2],
        },
    ];

    it('Creation', async () => {
        const contracts = await helpers.initContracts({
            governorOwner: GOBERNOR,
            period,
            minSubscriptionStake: minOracleOwnerStake.toString(),
            oracleManagerWhitelisted: [WHITELISTED_CALLER],
        });
        Object.assign(this, contracts);

        this.coinPair = web3.utils.asciiToHex('BTCUSD');
        this.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
        });
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
    });

    it('Registration and subscription', async () => {
        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });

        await this.oracleMgr.registerOracle(
            oracleData[0].owner,
            oracleData[0].account,
            oracleData[0].name,
            {
                from: WHITELISTED_CALLER,
            },
        );

        const info0 = await this.oracleMgr.getOracleRegistrationInfo(oracleData[0].owner);
        assert.equal(info0.internetName, oracleData[0].name);

        await this.oracleMgr.subscribeToCoinPair(oracleData[0].owner, this.coinPair, {
            from: WHITELISTED_CALLER,
        });
        assert.isTrue(await this.coinPairPrice.isSubscribed(oracleData[0].owner));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].owner));
    });

    it('Should fail to unsubscribe oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.unSubscribeFromCoinPair(oracleData[0].owner, this.coinPair),
            'Address is not whitelisted',
        );
    });

    it('Unsubscribe by gobernanza', async () => {
        const OracleManagerUnsubscribeChange = artifacts.require('OracleManagerUnsubscribeChange');
        const change = await OracleManagerUnsubscribeChange.new(
            this.oracleMgr.address,
            oracleData[0].owner,
            this.coinPair,
        );
        await this.governor.governor.executeChange(change.address, { from: GOBERNOR });
        assert.isFalse(await this.coinPairPrice.isSubscribed(oracleData[0].owner));
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].owner));
    });

    it('Should fail to remove oracle if not called by owner', async () => {
        await expectRevert(
            this.oracleMgr.removeOracle(oracleData[0].owner),
            'Address is not whitelisted',
        );
    });

    it('Remove by gobernanza', async () => {
        assert.isTrue(await this.oracleMgr.isOracleRegistered(oracleData[0].owner));
        // Oracle is still selected, withdraw so we can remove it.
        await this.staking.withdraw(oracleData[0].stake, { from: oracleData[0].owner });
        assert.equal((await this.staking.getBalance(oracleData[0].owner)).toString(), '0');

        const OracleManagerRemoveChange = artifacts.require('OracleManagerRemoveChange');
        const change = await OracleManagerRemoveChange.new(
            this.oracleMgr.address,
            oracleData[0].owner,
        );
        await this.governor.governor.executeChange(change.address, { from: GOBERNOR });
        assert.isFalse(await this.oracleMgr.isOracleRegistered(oracleData[0].owner));
    });
});
