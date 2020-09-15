const {BN} = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');

const ORACLE_QUANTITY = 21;
const COINPAIR = web3.utils.asciiToHex('BTCUSD');
const maxOraclesPerRound = 10;
const maxSubscribedOraclesPerRound = 30;

contract('CoinPairPrice Subscribe', async (accounts) => {
    async function register(token, staking, oracleManager, ownerAddr, stake, name, oracleAddr) {
        const initialBalance = await token.balanceOf(ownerAddr);
        await token.approve(staking.address, stake, {from: ownerAddr});
        await staking.registerOracle(oracleAddr, name, {from: ownerAddr});
        await staking.deposit(stake, ownerAddr, {from: ownerAddr});
        const info = await oracleManager.getOracleRegistrationInfo(ownerAddr);
        assert.equal(info.internetName, name);
        assert.equal(info.stake, stake);
        assert.equal(
            (await token.balanceOf(ownerAddr)).toString(),
            initialBalance.sub(new BN(stake)).toString(),
        );
    }

    async function initContracts(testobj) {
        const contracts = await helpers.initContracts({
            governorOwner: accounts[8],
            period: new BN(10),
        });
        Object.assign(testobj, contracts);
        testobj.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
            maxOraclesPerRound,
            maxSubscribedOraclesPerRound,
        });
        assert.equal(
            maxOraclesPerRound,
            (await testobj.coinPairPrice.maxOraclesPerRound()).toNumber(),
        );
        assert.equal((await testobj.coinPairPrice.getRoundInfo()).selectedOracles.length, 0);
        assert.equal((await testobj.coinPairPrice.getRoundInfo()).round, 0);
        const oracleList = [];
        for (let i = 0; i < ORACLE_QUANTITY; i++) {
            const oracleAddr = await helpers.newUnlockedAccount();
            const ownerAccount = await helpers.newUnlockedAccount();
            // Send funds to new owner account (token and base coin).
            await web3.eth.sendTransaction({
                from: accounts[10 + (i % 10)],
                to: ownerAccount,
                value: '1' + '0'.repeat(18),
            });
            await testobj.governor.mint(testobj.token.address, ownerAccount, '8' + '0'.repeat(20));

            const stake = 10000000000 + i * 100000;
            const name = 'ORACLE-' + i;
            await register(
                testobj.token,
                testobj.staking,
                testobj.oracleMgr,
                ownerAccount,
                stake,
                name,
                oracleAddr,
            );
            oracleList.push({oracleAddr: oracleAddr, ownerAddr: ownerAccount, stake});
        }
        return oracleList;
    }

    describe.skip("During round zero we don't add oracles on subscription, WE DON't HAVE ROUND ZERO NOW", () => {
        let oracleList;

        it('creation', async () => {
            oracleList = await initContracts(this);
        });

        it('Should subscribe oracleCant oracles and none goes to current round', async () => {
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            for (const {ownerAddr} of oracleList) {
                await this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAddr});
                const subscribed = await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR);
                assert.isTrue(subscribed);
                assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            }
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            await this.coinPairPrice.switchRound();
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );
        });
    });

    describe('During non zero we add oracles on subscription right away', () => {
        let oracleList;
        let ORACLE_WITH_A_LOT_OF_STAKE;
        let ORACLE_WITH_SMALL_STAKE;

        it('creation', async () => {
            oracleList = await initContracts(this);
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            await this.coinPairPrice.switchRound();
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            ORACLE_WITH_A_LOT_OF_STAKE = oracleList[ORACLE_QUANTITY - 1];
            ORACLE_WITH_SMALL_STAKE = oracleList[2];
        });

        it('Should subscribe oracleCant oracles and the first maxOraclesPerRound goes to current round', async () => {
            assert.equal(0, (await this.coinPairPrice.getRoundInfo()).selectedOracles.length);
            for (const {ownerAddr} of oracleList) {
                const cantPrev = (await this.coinPairPrice.getRoundInfo()).selectedOracles.length;

                await this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAddr});
                assert.isTrue(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));

                const cantPost = (await this.coinPairPrice.getRoundInfo()).selectedOracles.length;
                if (cantPrev < maxOraclesPerRound) {
                    assert.equal(cantPrev + 1, cantPost);
                } else {
                    assert.equal(maxOraclesPerRound, cantPost);
                }
            }
        });

        it('The oracles are added right away when we saturate the selected list the new ones even if have more stake must wait to next round', async () => {
            assert.isTrue(
                await this.oracleMgr.isSubscribed(ORACLE_WITH_SMALL_STAKE.ownerAddr, COINPAIR),
            );
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(
                    ORACLE_WITH_SMALL_STAKE.oracleAddr,
                ) >= 0,
            );

            assert.isTrue(
                await this.oracleMgr.isSubscribed(ORACLE_WITH_A_LOT_OF_STAKE.ownerAddr, COINPAIR),
            );
            assert.isFalse(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(
                    ORACLE_WITH_A_LOT_OF_STAKE.oracleAddr,
                ) >= 0,
            );
        });

        it('It is ok to unsubscribes and subscribes again in the same round', async () => {
            const {ownerAddr, oracleAddr} = ORACLE_WITH_SMALL_STAKE;

            await this.staking.unSubscribeFromCoinPair(COINPAIR, {from: ownerAddr});
            assert.isFalse(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            // Even after unsubscribe we are still in the round, is just a stop signal
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );

            await this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAddr});
            assert.isTrue(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );
        });

        it('In the next round ORACLE_WITH_SMALL_STAKE loose his place', async () => {
            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
            assert.isTrue(
                await this.oracleMgr.isSubscribed(ORACLE_WITH_SMALL_STAKE.ownerAddr, COINPAIR),
            );
            assert.isFalse(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(
                    ORACLE_WITH_SMALL_STAKE.oracleAddr,
                ) >= 0,
            );

            assert.isTrue(
                await this.oracleMgr.isSubscribed(ORACLE_WITH_A_LOT_OF_STAKE.ownerAddr, COINPAIR),
            );
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(
                    ORACLE_WITH_A_LOT_OF_STAKE.oracleAddr,
                ) >= 0,
            );
        });

        it('If ORACLE_WITH_A_LOT_OF_STAKE unsubscribes then he looses its place in next round', async () => {
            const {oracleAddr, ownerAddr} = ORACLE_WITH_A_LOT_OF_STAKE;
            assert.isTrue(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );

            await this.staking.unSubscribeFromCoinPair(COINPAIR, {from: ownerAddr});
            assert.isFalse(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );

            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();

            // We are not in selected oracles anymore
            assert.isFalse(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );

            // Even if we subscribe we don't get in the new round
            await this.staking.subscribeToCoinPair(COINPAIR, {from: ownerAddr});
            assert.isTrue(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            assert.isFalse(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );

            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();
            assert.isTrue(await this.oracleMgr.isSubscribed(ownerAddr, COINPAIR));
            assert.isTrue(
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.indexOf(oracleAddr) >= 0,
            );
            assert.equal(
                maxOraclesPerRound,
                (await this.coinPairPrice.getRoundInfo()).selectedOracles.length,
            );
        });
    });
});
