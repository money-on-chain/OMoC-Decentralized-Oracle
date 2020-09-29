const helpers = require('./helpers');
const {expectRevert, BN, time} = require('@openzeppelin/test-helpers');
const ethers = require('ethers');
const {ZERO_ADDRESS} = require('@openzeppelin/test-helpers/src/constants');
const {expect} = require('chai');

contract('CoinPairPrice', async (accounts) => {
    const feeSourceAccount = accounts[0];

    /* Account is the simulated oracle server address. The stake 
       will come from the owner's address. */

    beforeEach(async () => {
        this.validPricePeriodInBlocks = 3;

        const contracts = await helpers.initContracts({governorOwner: accounts[8]});
        Object.assign(this, contracts);

        this.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
            ...contracts,
            whitelist: [accounts[0]],
            maxOraclesPerRound: 4,
            validPricePeriodInBlocks: this.validPricePeriodInBlocks,
        });
        await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
        await this.governor.mint(this.token.address, accounts[8], '800000000000000000000');

        const providerType = await this.coinPairPrice.getPriceProviderType();
        expect(providerType).to.be.bignumber.equal(new BN(1));
        const roundLockPeriod = await this.coinPairPrice.roundLockPeriodSecs();
        expect(roundLockPeriod).to.be.bignumber.equal(new BN(60));
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
            stake: (3 * 10 ** 18).toString(),
            account: accounts[5],
            owner: accounts[6],
        },
        {
            name: 'oracle-d.io',
            stake: (1 * 10 ** 18).toString(),
            account: accounts[7],
            owner: accounts[8],
        },
    ];

    it('Points are distributed correctly to 4 owners', async () => {
        // REGISTER ORACLES A, B, C AND D AND DEPOSIT STAKE
        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.token.approve(this.staking.address, oracleData[2].stake, {
            from: oracleData[2].owner,
        });
        await this.token.approve(this.staking.address, oracleData[3].stake, {
            from: oracleData[3].owner,
        });

        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });

        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });

        await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
            from: oracleData[2].owner,
        });
        await this.staking.deposit(oracleData[2].stake, oracleData[2].owner, {
            from: oracleData[2].owner,
        });

        await this.staking.registerOracle(oracleData[3].account, oracleData[3].name, {
            from: oracleData[3].owner,
        });
        await this.staking.deposit(oracleData[3].stake, oracleData[3].owner, {
            from: oracleData[3].owner,
        });

        // ORACLES SUBSCRIPTION TO COINPAIR
        const thisCoinPair = await this.coinPairPrice.getCoinPair();
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[0].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[1].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[2].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[3].owner,
        });

        // FEES TRANSFER
        const FEES = new BN((0.33 * 10 ** 18).toString());

        const oldFees = await this.coinPairPrice.getAvailableRewardFees();
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });
        assert.equal(
            await this.coinPairPrice.getAvailableRewardFees(),
            oldFees.add(FEES).toString(),
        );

        // START THE FIRST ROUND
        await this.coinPairPrice.switchRound();

        // Add up points submitting several prices from Oracles A,B,C and D
        let roundInfo = await this.coinPairPrice.getRoundInfo();
        // Oracle A    publications.
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        // Oracle B  publications.

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        // Oracle C  publications.
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[2].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[2].account},
            );
        }
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[2].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[2].account},
            );
        }
        // Oracle D  publications.
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[3].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            const s4 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[3].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s4.v, s3.v, s2.v, s1.v],
                [s4.r, s3.r, s2.r, s1.r],
                [s4.s, s3.s, s2.s, s1.s],
                {from: oracleData[3].account},
            );
        }

        // Verify proper distribution according to total fee balance and
        // points of oracles.

        const sourceBalance = await this.coinPairPrice.getAvailableRewardFees();

        const ownerBalance1 = await this.token.balanceOf(oracleData[0].owner);
        const ownerBalance2 = await this.token.balanceOf(oracleData[1].owner);
        const ownerBalance3 = await this.token.balanceOf(oracleData[2].owner);
        const ownerBalance4 = await this.token.balanceOf(oracleData[3].owner);
        const ownerPoints1 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[0].owner))
            .points;
        const ownerPoints2 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[1].owner))
            .points;
        const ownerPoints3 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[2].owner))
            .points;
        const ownerPoints4 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[3].owner))
            .points;
        const totalPoints = ownerPoints1.add(ownerPoints2).add(ownerPoints3).add(ownerPoints4);

        const expectedReward1 = ownerPoints1.mul(sourceBalance).div(totalPoints);
        const expectedReward2 = ownerPoints2.mul(sourceBalance).div(totalPoints);
        const expectedReward3 = ownerPoints3.mul(sourceBalance).div(totalPoints);
        const expectedReward4 = ownerPoints4.mul(sourceBalance).div(totalPoints);
        const expectedTotalReward = expectedReward1
            .add(expectedReward2)
            .add(expectedReward3)
            .add(expectedReward4);

        const selOracles = (await this.coinPairPrice.getRoundInfo()).selectedOracles;

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        // Check if participating oracles in prev round are cleared properly.

        for (let i = 0; i < selOracles.length; i++) {
            const info = await this.coinPairPrice.getOracleRoundInfo(selOracles[i]);
            assert.equal(info.points, 0);
        }

        const expectedBalance1 = ownerBalance1.add(expectedReward1);
        const expectedBalance2 = ownerBalance2.add(expectedReward2);
        const expectedBalance3 = ownerBalance3.add(expectedReward3);
        const expectedBalance4 = ownerBalance4.add(expectedReward4);

        assert.equal(
            expectedBalance1.toString(),
            (await this.token.balanceOf(oracleData[0].owner)).toString(),
        );
        assert.equal(
            expectedBalance2.toString(),
            (await this.token.balanceOf(oracleData[1].owner)).toString(),
        );
        assert.equal(
            expectedBalance3.toString(),
            (await this.token.balanceOf(oracleData[2].owner)).toString(),
        );
        assert.equal(
            expectedBalance4.toString(),
            (await this.token.balanceOf(oracleData[3].owner)).toString(),
        );

        const postFeeBalance = await this.coinPairPrice.getAvailableRewardFees();
        assert.equal(
            postFeeBalance.toString(),
            BN(sourceBalance).sub(expectedTotalReward).toString(),
        );
    });

    it('Points are distributed correctly to 3 owners', async () => {
        // REGISTER ORACLES A, B AND C AND DEPOSIT STAKE
        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });
        await this.token.approve(this.staking.address, oracleData[2].stake, {
            from: oracleData[2].owner,
        });

        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });

        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });

        await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
            from: oracleData[2].owner,
        });
        await this.staking.deposit(oracleData[2].stake, oracleData[2].owner, {
            from: oracleData[2].owner,
        });

        // ORACLES SUBSCRIPTION TO COINPAIR
        const thisCoinPair = await this.coinPairPrice.getCoinPair();
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[0].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[1].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[2].owner,
        });

        // FEES TRANSFER
        const FEES = new BN((0.33 * 10 ** 18).toString());

        const oldFees = await this.coinPairPrice.getAvailableRewardFees();
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });
        assert.equal(
            await this.coinPairPrice.getAvailableRewardFees(),
            oldFees.add(FEES).toString(),
        );

        // START THE FIRST ROUND
        await this.coinPairPrice.switchRound();

        // Add up points submitting several prices from Oracles A,B and C
        let roundInfo = await this.coinPairPrice.getRoundInfo();
        // Oracle A    publications.
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        // Oracle B  publications.

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        // Oracle C  publications.
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[2].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[2].account},
            );
        }
        roundInfo = await this.coinPairPrice.getRoundInfo();
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[2].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            const s3 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[2].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s3.v, s2.v, s1.v],
                [s3.r, s2.r, s1.r],
                [s3.s, s2.s, s1.s],
                {from: oracleData[2].account},
            );
        }

        // Verify proper distribution according to total fee balance and
        // points of oracles.

        const sourceBalance = await this.coinPairPrice.getAvailableRewardFees();

        const ownerBalance1 = await this.token.balanceOf(oracleData[0].owner);
        const ownerBalance2 = await this.token.balanceOf(oracleData[1].owner);
        const ownerBalance3 = await this.token.balanceOf(oracleData[2].owner);
        const ownerPoints1 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[0].owner))
            .points;
        const ownerPoints2 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[1].owner))
            .points;
        const ownerPoints3 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[2].owner))
            .points;
        const totalPoints = ownerPoints1.add(ownerPoints2).add(ownerPoints3);

        const expectedReward1 = ownerPoints1.mul(sourceBalance).div(totalPoints);
        const expectedReward2 = ownerPoints2.mul(sourceBalance).div(totalPoints);
        const expectedReward3 = ownerPoints3.mul(sourceBalance).div(totalPoints);
        const expectedTotalReward = expectedReward1.add(expectedReward2).add(expectedReward3);

        const selOracles = (await this.coinPairPrice.getRoundInfo()).selectedOracles;

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        // Check if participating oracles in prev round are cleared properly.

        for (let i = 0; i < selOracles.length; i++) {
            const info = await this.coinPairPrice.getOracleRoundInfo(selOracles[i]);
            assert.equal(info.points, 0);
        }

        const expectedBalance1 = ownerBalance1.add(expectedReward1);
        const expectedBalance2 = ownerBalance2.add(expectedReward2);
        const expectedBalance3 = ownerBalance3.add(expectedReward3);

        assert.equal(
            expectedBalance1.toString(),
            (await this.token.balanceOf(oracleData[0].owner)).toString(),
        );
        assert.equal(
            expectedBalance2.toString(),
            (await this.token.balanceOf(oracleData[1].owner)).toString(),
        );
        assert.equal(
            expectedBalance3.toString(),
            (await this.token.balanceOf(oracleData[2].owner)).toString(),
        );

        const postFeeBalance = await this.coinPairPrice.getAvailableRewardFees();
        assert.equal(
            postFeeBalance.toString(),
            BN(sourceBalance).sub(expectedTotalReward).toString(),
        );
    });

    it('Points are distributed correctly to 2 owners', async () => {
        // REGISTER ORACLES A and B AND DEPOSIT STAKE
        await this.token.approve(this.staking.address, oracleData[0].stake, {
            from: oracleData[0].owner,
        });
        await this.token.approve(this.staking.address, oracleData[1].stake, {
            from: oracleData[1].owner,
        });

        await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
            from: oracleData[0].owner,
        });
        await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
            from: oracleData[0].owner,
        });

        await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
            from: oracleData[1].owner,
        });
        await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
            from: oracleData[1].owner,
        });

        // ORACLE SUBSCRIPTION TO COINPAIR
        const thisCoinPair = await this.coinPairPrice.getCoinPair();
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[0].owner,
        });
        await this.staking.subscribeToCoinPair(thisCoinPair, {
            from: oracleData[1].owner,
        });

        // FEES TRANSFER
        const FEES = new BN((0.33 * 10 ** 18).toString());

        const oldFees = await this.coinPairPrice.getAvailableRewardFees();
        await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
            from: feeSourceAccount,
        });
        assert.equal(
            await this.coinPairPrice.getAvailableRewardFees(),
            oldFees.add(FEES).toString(),
        );

        // START THE FIRST ROUND
        await this.coinPairPrice.switchRound();

        // Add up points submitting several prices from Oracles A and B
        let roundInfo = await this.coinPairPrice.getRoundInfo();
        // Oracle A    publications.
        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[0].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[0].account},
            );
        }

        // Oracle B  publications.

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        roundInfo = await this.coinPairPrice.getRoundInfo();

        {
            const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                3,
                'BTCUSD',
                (0.3 * 10 ** 18).toString(),
                oracleData[1].account,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
            );
            const s1 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[0].account),
            );
            const s2 = ethers.utils.splitSignature(
                await web3.eth.sign(encMsg, oracleData[1].account),
            );
            await this.coinPairPrice.publishPrice(
                msg.version,
                web3.utils.asciiToHex('BTCUSD'),
                msg.price,
                msg.votedOracle,
                (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                [s2.v, s1.v],
                [s2.r, s1.r],
                [s2.s, s1.s],
                {from: oracleData[1].account},
            );
        }

        // Verify proper distribution according to total fee balance and
        // points of oracles.

        const sourceBalance = await this.coinPairPrice.getAvailableRewardFees();

        const ownerBalance1 = await this.token.balanceOf(oracleData[0].owner);
        const ownerBalance2 = await this.token.balanceOf(oracleData[1].owner);
        const ownerPoints1 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[0].owner))
            .points;
        const ownerPoints2 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[1].owner))
            .points;
        const totalPoints = ownerPoints1.add(ownerPoints2);

        const expectedReward1 = ownerPoints1.mul(sourceBalance).div(totalPoints);
        const expectedReward2 = ownerPoints2.mul(sourceBalance).div(totalPoints);
        const expectedTotalReward = expectedReward1.add(expectedReward2);

        const selOracles = (await this.coinPairPrice.getRoundInfo()).selectedOracles;

        await helpers.mineUntilNextRound(this.coinPairPrice);
        await this.coinPairPrice.switchRound();

        // Check if participating oracles in prev round are cleared properly.

        for (let i = 0; i < selOracles.length; i++) {
            const info = await this.coinPairPrice.getOracleRoundInfo(selOracles[i]);
            assert.equal(info.points, 0);
        }

        const expectedBalance1 = ownerBalance1.add(expectedReward1);
        const expectedBalance2 = ownerBalance2.add(expectedReward2);

        assert.equal(
            expectedBalance1.toString(),
            (await this.token.balanceOf(oracleData[0].owner)).toString(),
        );
        assert.equal(
            expectedBalance2.toString(),
            (await this.token.balanceOf(oracleData[1].owner)).toString(),
        );

        const postFeeBalance = await this.coinPairPrice.getAvailableRewardFees();
        assert.equal(
            postFeeBalance.toString(),
            BN(sourceBalance).sub(expectedTotalReward).toString(),
        );
    });

    describe('Test with maxOraclesPerRound equal to 3', async () => {
        beforeEach(async () => {
            this.validPricePeriodInBlocks = 3;

            const contracts = await helpers.initContracts({governorOwner: accounts[8]});
            Object.assign(this, contracts);

            this.coinPairPrice = await helpers.initCoinpair('BTCUSD', {
                ...contracts,
                whitelist: [accounts[0]],
                maxOraclesPerRound: 3,
                validPricePeriodInBlocks: this.validPricePeriodInBlocks,
            });
            await this.governor.mint(this.token.address, accounts[0], '800000000000000000000');
            await this.governor.mint(this.token.address, accounts[2], '800000000000000000000');
            await this.governor.mint(this.token.address, accounts[4], '800000000000000000000');
            await this.governor.mint(this.token.address, accounts[6], '800000000000000000000');
            await this.governor.mint(this.token.address, accounts[8], '800000000000000000000');

            const providerType = await this.coinPairPrice.getPriceProviderType();
            expect(providerType).to.be.bignumber.equal(new BN(1));
            const roundLockPeriod = await this.coinPairPrice.roundLockPeriodSecs();
            expect(roundLockPeriod).to.be.bignumber.equal(new BN(60));
        });

        it("Owner is replaced in round for another one and doesn't receive the points", async () => {
            // REGISTER ORACLES A, B, C AND D AND DEPOSIT STAKE
            await this.token.approve(this.staking.address, oracleData[0].stake, {
                from: oracleData[0].owner,
            });
            await this.token.approve(this.staking.address, oracleData[1].stake, {
                from: oracleData[1].owner,
            });
            await this.token.approve(this.staking.address, oracleData[2].stake, {
                from: oracleData[2].owner,
            });
            await this.token.approve(this.staking.address, oracleData[3].stake, {
                from: oracleData[3].owner,
            });

            await this.staking.registerOracle(oracleData[0].account, oracleData[0].name, {
                from: oracleData[0].owner,
            });
            await this.staking.deposit(oracleData[0].stake, oracleData[0].owner, {
                from: oracleData[0].owner,
            });

            await this.staking.registerOracle(oracleData[1].account, oracleData[1].name, {
                from: oracleData[1].owner,
            });
            await this.staking.deposit(oracleData[1].stake, oracleData[1].owner, {
                from: oracleData[1].owner,
            });

            await this.staking.registerOracle(oracleData[2].account, oracleData[2].name, {
                from: oracleData[2].owner,
            });
            await this.staking.deposit(oracleData[2].stake, oracleData[2].owner, {
                from: oracleData[2].owner,
            });

            await this.staking.registerOracle(oracleData[3].account, oracleData[3].name, {
                from: oracleData[3].owner,
            });
            await this.staking.deposit(oracleData[3].stake, oracleData[3].owner, {
                from: oracleData[3].owner,
            });

            // ORACLES SUBSCRIPTION TO COINPAIR
            const thisCoinPair = await this.coinPairPrice.getCoinPair();
            await this.staking.subscribeToCoinPair(thisCoinPair, {
                from: oracleData[0].owner,
            });
            await this.staking.subscribeToCoinPair(thisCoinPair, {
                from: oracleData[1].owner,
            });
            await this.staking.subscribeToCoinPair(thisCoinPair, {
                from: oracleData[2].owner,
            });
            await this.staking.subscribeToCoinPair(thisCoinPair, {
                from: oracleData[3].owner,
            });

            // FEES TRANSFER
            const FEES = new BN((0.33 * 10 ** 18).toString());

            const oldFees = await this.coinPairPrice.getAvailableRewardFees();
            await this.token.transfer(this.coinPairPrice.address, FEES.toString(), {
                from: feeSourceAccount,
            });
            assert.equal(
                await this.coinPairPrice.getAvailableRewardFees(),
                oldFees.add(FEES).toString(),
            );

            // START THE FIRST ROUND
            await this.coinPairPrice.switchRound();

            // Add up points submitting several prices from Oracles A,B and C
            let roundInfo = await this.coinPairPrice.getRoundInfo();
            // Oracle A    publications.
            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[0].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[0].account},
                );
            }

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[0].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[0].account},
                );
            }

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[0].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[0].account},
                );
            }

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[0].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[0].account},
                );
            }

            // Oracle B  publications.

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[1].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[1].account},
                );
            }

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[1].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[1].account},
                );
            }

            roundInfo = await this.coinPairPrice.getRoundInfo();

            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[1].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[1].account},
                );
            }

            // Oracle C  publications.
            roundInfo = await this.coinPairPrice.getRoundInfo();
            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[2].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[2].account},
                );
            }
            roundInfo = await this.coinPairPrice.getRoundInfo();
            {
                const {msg, encMsg} = await helpers.getDefaultEncodedMessage(
                    3,
                    'BTCUSD',
                    (0.3 * 10 ** 18).toString(),
                    oracleData[2].account,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                );
                const s1 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[0].account),
                );
                const s2 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[1].account),
                );
                const s3 = ethers.utils.splitSignature(
                    await web3.eth.sign(encMsg, oracleData[2].account),
                );
                await this.coinPairPrice.publishPrice(
                    msg.version,
                    web3.utils.asciiToHex('BTCUSD'),
                    msg.price,
                    msg.votedOracle,
                    (await this.coinPairPrice.getLastPublicationBlock()).toString(),
                    [s3.v, s2.v, s1.v],
                    [s3.r, s2.r, s1.r],
                    [s3.s, s2.s, s1.s],
                    {from: oracleData[2].account},
                );
            }

            await helpers.mineBlocks(1);

            const ownerPoints3BeforeLeavingRound = (
                await this.coinPairPrice.getOracleRoundInfo(oracleData[2].owner)
            ).points;

            const withdrawAmount = Math.round(
                (parseInt(oracleData[2].stake, 10) * 5) / 6,
            ).toString();
            await this.staking.withdraw(withdrawAmount, {from: oracleData[2].owner});
            await helpers.mineBlocks(1);

            // Verify proper distribution according to total fee balance and
            // points of oracles.

            const sourceBalance = await this.coinPairPrice.getAvailableRewardFees();

            const ownerBalance1 = await this.token.balanceOf(oracleData[0].owner);
            const ownerBalance2 = await this.token.balanceOf(oracleData[1].owner);
            const ownerBalance3 = await this.token.balanceOf(oracleData[2].owner);
            const ownerPoints1 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[0].owner))
                .points;
            const ownerPoints2 = (await this.coinPairPrice.getOracleRoundInfo(oracleData[1].owner))
                .points;
            const ownerPoints3AfterLeavingRound = (
                await this.coinPairPrice.getOracleRoundInfo(oracleData[2].owner)
            ).points;
            const totalPoints = ownerPoints1.add(ownerPoints2).add(ownerPoints3BeforeLeavingRound);

            const expectedReward1 = ownerPoints1.mul(sourceBalance).div(totalPoints);
            const expectedReward2 = ownerPoints2.mul(sourceBalance).div(totalPoints);
            const expectedReward3 = ownerPoints3AfterLeavingRound
                .mul(sourceBalance)
                .div(totalPoints);
            const expectedTotalReward = expectedReward1.add(expectedReward2).add(expectedReward3);

            const selOracles = (await this.coinPairPrice.getRoundInfo()).selectedOracles;

            await helpers.mineUntilNextRound(this.coinPairPrice);
            await this.coinPairPrice.switchRound();

            // Check if participating oracles in prev round are cleared properly.

            for (let i = 0; i < selOracles.length; i++) {
                const info = await this.coinPairPrice.getOracleRoundInfo(selOracles[i]);
                assert.equal(info.points, 0);
            }

            const expectedBalance1 = ownerBalance1.add(expectedReward1);
            const expectedBalance2 = ownerBalance2.add(expectedReward2);
            const expectedBalance3 = ownerBalance3.add(expectedReward3);

            assert.equal(
                expectedBalance1.toString(),
                (await this.token.balanceOf(oracleData[0].owner)).toString(),
            );
            assert.equal(
                expectedBalance2.toString(),
                (await this.token.balanceOf(oracleData[1].owner)).toString(),
            );
            assert.equal(
                expectedBalance3.toString(),
                (await this.token.balanceOf(oracleData[2].owner)).toString(),
            );

            const postFeeBalance = await this.coinPairPrice.getAvailableRewardFees();
            assert.equal(
                postFeeBalance.toString(),
                BN(sourceBalance).sub(expectedTotalReward).toString(),
            );
        });
    });
});
