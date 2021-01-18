const helpers = require('./helpers');
const CoinPairEmergencyWhitelistChange = artifacts.require('CoinPairEmergencyWhitelistChange');
const { expect } = require('chai');
const { expectRevert, BN, expectEvent } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract('CoinPairPrice Emergency Publish', async (accounts) => {
    const EMERGENCY_PUBLISHER = accounts[2];
    const emergencyPublishingPeriodInBlocks = 20;
    const minSubscriptionStake = (10 ** 18).toString();
    const coinPair = web3.utils.asciiToHex('BTCUSD');
    before(async () => {
        const contracts = await helpers.initContracts({
            governorOwner: accounts[8],
            minSubscriptionStake,
        });
        Object.assign(this, contracts);
        this.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
            emergencyPublishingPeriodInBlocks,
            validPricePeriodInBlocks: 30,
        });
        const change = await CoinPairEmergencyWhitelistChange.new(
            this.coinPairPrice.address,
            EMERGENCY_PUBLISHER,
        );
        await this.governor.execute(change);
    });

    it('Should fail to emergency publish if not whitelisted', async () => {
        const NOT_A_PUBLISHED = accounts[1];
        assert.notEqual(EMERGENCY_PUBLISHER, NOT_A_PUBLISHED);

        await expectRevert(
            this.coinPairPrice.emergencyPublish(1234, { from: NOT_A_PUBLISHED }),
            'Address is not whitelisted',
        );
    });

    it('Should fail to publish a zero price', async () => {
        await expectRevert(
            this.coinPairPrice.emergencyPublish(0, { from: EMERGENCY_PUBLISHER }),
            'Price must be positive and non-zero',
        );
    });

    it('Should fail to publish before emergencyPublishingPeriodInBlocks', async () => {
        await expectRevert(
            this.coinPairPrice.emergencyPublish(1234, { from: EMERGENCY_PUBLISHER }),
            "Emergency publish period didn't started",
        );
    });

    it('Should success to emergency publish after emergencyPublishingPeriodInBlocks blocks', async () => {
        const TO_PUBLISH = '1460';
        const prev = await this.coinPairPrice.peek();
        expect(prev[1], 'valid').to.be.true;

        await helpers.mineBlocks(emergencyPublishingPeriodInBlocks);
        let receipt = await this.coinPairPrice.emergencyPublish(TO_PUBLISH, {
            from: EMERGENCY_PUBLISHER,
        });
        const latestBlock = await helpers.getLatestBlock();
        expectEvent(receipt, 'EmergencyPricePublished', {
            sender: EMERGENCY_PUBLISHER,
            price: TO_PUBLISH,
            votedOracle: EMERGENCY_PUBLISHER,
            blockNumber: latestBlock,
        });
        const post = await this.coinPairPrice.peek();
        assert.notEqual(prev, post);
        expect(post[1], 'valid').to.be.true;
        expect(web3.utils.toBN(post[0]), 'Price After').to.be.bignumber.equal(new BN(TO_PUBLISH));
    });

    it('Should success to emergency publish after a regular publication and emergencyPublishingPeriodInBlocks blocks', async () => {
        // Register Oracle
        const ORACLE_OWNER = accounts[0];
        const ORACLE_ADDR = accounts[1];
        await this.governor.mint(this.token.address, ORACLE_OWNER, '800000000000000000000');
        await this.token.approve(this.staking.address, minSubscriptionStake, {
            from: ORACLE_OWNER,
        });
        await this.staking.deposit(minSubscriptionStake, ORACLE_OWNER, { from: ORACLE_OWNER });
        await this.staking.registerOracle(ORACLE_ADDR, 'SOME_NAME', { from: ORACLE_OWNER });
        await this.staking.subscribeToCoinPair(coinPair, { from: ORACLE_OWNER });
        await this.coinPairPrice.switchRound();

        // Publish a price
        const thisCoinPair = await this.coinPairPrice.getCoinPair();
        const lastPubBlock = (await this.coinPairPrice.getLastPublicationBlock()).toString();
        const { msg, encMsg } = await helpers.getDefaultEncodedMessage(
            3,
            helpers.coinPairStr(thisCoinPair),
            '1233547895',
            ORACLE_ADDR,
            lastPubBlock,
        );
        const signature = ethers.utils.splitSignature(await web3.eth.sign(encMsg, ORACLE_ADDR));
        await this.coinPairPrice.publishPrice(
            msg.version,
            thisCoinPair,
            msg.price,
            msg.votedOracle,
            msg.blockNumber,
            [signature.v],
            [signature.r],
            [signature.s],
            { from: ORACLE_ADDR },
        );

        // fail
        await expectRevert(
            this.coinPairPrice.emergencyPublish(1234, { from: EMERGENCY_PUBLISHER }),
            "Emergency publish period didn't started",
        );

        // success
        const TO_PUBLISH = '1460';
        const prev = await this.coinPairPrice.peek();
        expect(prev[1], 'valid').to.be.true;
        await helpers.mineBlocks(emergencyPublishingPeriodInBlocks);
        await this.coinPairPrice.emergencyPublish(TO_PUBLISH, { from: EMERGENCY_PUBLISHER });
        const post = await this.coinPairPrice.peek();
        assert.notEqual(prev, post);
        expect(post[1], 'valid').to.be.true;
        expect(web3.utils.toBN(post[0]), 'Price After').to.be.bignumber.equal(new BN(TO_PUBLISH));
    });
});
