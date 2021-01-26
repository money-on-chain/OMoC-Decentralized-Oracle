const helpers = require('./helpers');
const CoinPairEmergencyWhitelistChange = artifacts.require('CoinPairEmergencyWhitelistChange');
const { expect } = require('chai');
const { expectRevert, BN, expectEvent } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');

contract('CoinPairPrice Emergency Publish', async (accounts) => {
    const EMERGENCY_PUBLISHER = accounts[7];
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
        // Register Oracles
        const oracles = [
            {
                owner: accounts[0],
                address: accounts[1],
                name: 'oracle1',
            },
            {
                owner: accounts[2],
                address: accounts[3],
                name: 'oracle2',
            },
            {
                owner: accounts[4],
                address: accounts[5],
                name: 'oracle3',
            },
        ];
        for (let i = 0; i < oracles.length; i++) {
            await this.governor.mint(this.token.address, oracles[i].owner, '800000000000000000000');
            await this.token.approve(this.staking.address, minSubscriptionStake, {
                from: oracles[i].owner,
            });
            await this.staking.deposit(minSubscriptionStake, oracles[i].owner, {
                from: oracles[i].owner,
            });
            await this.staking.registerOracle(oracles[i].address, oracles[i].name, {
                from: oracles[i].owner,
            });
            await this.staking.subscribeToCoinPair(coinPair, { from: oracles[i].owner });
        }
        await this.coinPairPrice.switchRound();

        // Publish a price
        const thisCoinPair = await this.coinPairPrice.getCoinPair();
        const lastPubBlock = (await this.coinPairPrice.getLastPublicationBlock()).toString();
        const { msg, encMsg } = await helpers.getDefaultEncodedMessage(
            3,
            helpers.coinPairStr(thisCoinPair),
            '1233547895',
            oracles[0].address,
            lastPubBlock,
        );
        const s1 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[0].address));
        const s2 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[1].address));
        const s3 = ethers.utils.splitSignature(await web3.eth.sign(encMsg, oracles[2].address));

        await this.coinPairPrice.publishPrice(
            msg.version,
            thisCoinPair,
            msg.price,
            msg.votedOracle,
            msg.blockNumber,
            [s3.v, s2.v, s1.v],
            [s3.r, s2.r, s1.r],
            [s3.s, s2.s, s1.s],
            { from: oracles[0].address },
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
