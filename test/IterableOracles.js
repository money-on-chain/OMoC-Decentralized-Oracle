/* global artifacts, beforeEach, contract, it */
const {BN, expectRevert, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {toChecksumAddress, randomHex, toBN, padLeft, numberToHex} = require('web3-utils');
const {ADDRESS_ZERO, ADDRESS_ONE} = require('./helpers');

const IterableOracles = artifacts.require('IterableOraclesMock');

contract('IterableOracles', (accounts) => {
    const [dummy, invalid] = accounts;

    const ORACLES_DATA = [
        {
            owner: accounts[2],
            address: toChecksumAddress(padLeft(numberToHex(11), 40)),
            url: 'https://example.org/oracle11',
        },
        {
            owner: accounts[3],
            address: toChecksumAddress(padLeft(numberToHex(12), 40)),
            url: 'https://example.org/oracle12',
        },
        {
            owner: accounts[4],
            address: toChecksumAddress(padLeft(numberToHex(13), 40)),
            url: 'https://example.org/oracle13',
        },
        {
            owner: accounts[5],
            address: toChecksumAddress(padLeft(numberToHex(14), 40)),
            url: 'https://example.org/oracle14',
        },
    ];

    let iterableOracles;

    before(async () => {
        iterableOracles = await IterableOracles.new();
        expect(iterableOracles).to.not.be.undefined;
    });

    it('fail registration zero address', async () => {
        await expectRevert(
            iterableOracles.registerOracle(
                ADDRESS_ZERO,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ),
            'Owner address cannot be 0x0',
        );

        await expectRevert(
            iterableOracles.registerOracle(
                ADDRESS_ONE,
                ADDRESS_ZERO,
                'https://example.org/oracle0',
            ),
            'Oracle address cannot be 0x0',
        );
    });

    it('registration success', async () => {
        for (oracle of ORACLES_DATA) {
            await iterableOracles.registerOracle(oracle.owner, oracle.address, oracle.url);

            const oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
            expect(oracleRegistered).to.be.true;
            const ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
            expect(ownerRegistered).to.be.true;

            const {oracleAddress, url} = await iterableOracles.getOracleInfo(oracle.owner);
            expect(oracleAddress).to.equal(oracle.address);
            expect(url).to.equal(oracle.url);

            const owner = await iterableOracles.getOwner(oracle.address);
            expect(owner).to.equal(oracle.owner);
        }

        const length = await iterableOracles.getLen();
        expect(length).to.be.bignumber.equal(new BN(ORACLES_DATA.length));

        await expectRevert(iterableOracles.getOracleAtIndex(length.toNumber()), 'Illegal index');
        const result = await iterableOracles.getOracleAtIndex(0);
        expect(result.ownerAddress).to.equal(ORACLES_DATA[0].owner);
        expect(result.oracleAddress).to.equal(ORACLES_DATA[0].address);
        expect(result.url).to.equal(ORACLES_DATA[0].url);
    });

    it('fail registration already registered', async () => {
        const oracle = ORACLES_DATA[0];
        await expectRevert(
            iterableOracles.registerOracle(
                oracle.owner,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ),
            'Owner already registered',
        );
        await expectRevert(
            iterableOracles.registerOracle(dummy, oracle.address, 'https://example.org/oracle0'),
            'Oracle already registered',
        );
    });

    it('fail to change url', async () => {
        await expectRevert(
            iterableOracles.setName(ADDRESS_ZERO, 'https://example.org/bad'),
            'Oracle owner is not registered',
        );
    });

    it('change url', async () => {
        const oracle = ORACLES_DATA[0];
        const newName = 'https://example.org/setName';

        const {found, url: oldName} = await iterableOracles.getInternetName(oracle.owner);
        expect(found).to.be.true;
        expect(oldName).to.equal(oracle.url);
        expect(oldName).to.not.equal(newName);

        await iterableOracles.setName(oracle.owner, newName);
        const {url: updatedName} = await iterableOracles.getInternetName(oracle.owner);
        expect(updatedName).to.equal(newName);
    });

    it('fail to change oracle address', async () => {
        const oracle = ORACLES_DATA[0];
        await expectRevert(
            iterableOracles.setOracleAddress(ADDRESS_ZERO, ADDRESS_ONE),
            'Oracle owner is not registered',
        );
        await expectRevert(
            iterableOracles.setOracleAddress(oracle.owner, oracle.address),
            'Oracle already registered',
        );
    });

    it('change oracle address', async () => {
        const oracle = ORACLES_DATA[0];
        const newAddress = toChecksumAddress(padLeft(numberToHex(100), 40));

        const oldAddress = await iterableOracles.getOracleAddress(oracle.owner);
        expect(oldAddress).to.equal(oracle.address);
        expect(oldAddress).to.not.equal(newAddress);

        await iterableOracles.setOracleAddress(oracle.owner, newAddress);
        const updatedAddress = await iterableOracles.getOracleAddress(oracle.owner);
        expect(updatedAddress).to.equal(newAddress);

        oracle.address = newAddress;
    });

    it('fail to get an invalid owner', async () => {
        expect(await iterableOracles.getOracleAddress(invalid)).to.equal(constants.ZERO_ADDRESS);
        const {found} = await iterableOracles.getInternetName(invalid);
        expect(found).to.be.false;
    });

    it('remove failure', async () => {
        await expectRevert(
            iterableOracles.removeOracle(ADDRESS_ZERO),
            'Owner address cannot be 0x0',
        );
        await expectRevert(iterableOracles.removeOracle(ADDRESS_ONE), 'Owner not registered');
    });

    it('remove success', async () => {
        const oracle = ORACLES_DATA[0];

        let oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
        expect(oracleRegistered).to.be.true;
        let ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
        expect(ownerRegistered).to.be.true;

        await iterableOracles.removeOracle(oracle.owner);

        oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
        expect(oracleRegistered).to.be.false;
        ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
        expect(ownerRegistered).to.be.false;

        await expectRevert(iterableOracles.removeOracle(oracle.owner), 'Owner not registered');
    });
});
