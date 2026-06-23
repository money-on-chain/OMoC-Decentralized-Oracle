import { expect } from 'chai';
import { network } from 'hardhat';
import { getAddress, toBeHex, zeroPadValue } from 'ethers';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

function addressFromNumber(value: number): string {
    return getAddress(zeroPadValue(toBeHex(value), 20));
}

describe('IterableOracles', function () {
    let ethers: Awaited<ReturnType<typeof network.create>>['ethers'];
    let accounts: Awaited<ReturnType<typeof ethers.getSigners>>;
    let iterableOracles: any;

    let dummy: string;
    let invalid: string;

    let ORACLES_DATA: Array<{
        owner: string;
        address: string;
        url: string;
    }>;

    beforeEach(async function () {
        ({ ethers } = await network.create());

        accounts = await ethers.getSigners();

        dummy = accounts[0].address;
        invalid = accounts[1].address;

        ORACLES_DATA = [
            {
                owner: accounts[2].address,
                address: addressFromNumber(11),
                url: 'https://example.org/oracle11',
            },
            {
                owner: accounts[3].address,
                address: addressFromNumber(12),
                url: 'https://example.org/oracle12',
            },
            {
                owner: accounts[4].address,
                address: addressFromNumber(13),
                url: 'https://example.org/oracle13',
            },
            {
                owner: accounts[5].address,
                address: addressFromNumber(14),
                url: 'https://example.org/oracle14',
            },
        ];

        const IterableOracles = await ethers.getContractFactory('IterableOraclesMock');
        iterableOracles = await IterableOracles.deploy();

        expect(iterableOracles).to.not.be.undefined;
    });

    async function registerOracles() {
        for (const oracle of ORACLES_DATA) {
            await iterableOracles.registerOracle(oracle.owner, oracle.address, oracle.url);
        }
    }

    it('fail registration zero address', async function () {
        await expect(
            iterableOracles.registerOracle(
                ADDRESS_ZERO,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ),
        ).to.be.revertedWith('Owner address cannot be 0x0');

        await expect(
            iterableOracles.registerOracle(
                ADDRESS_ONE,
                ADDRESS_ZERO,
                'https://example.org/oracle0',
            ),
        ).to.be.revertedWith('Oracle address cannot be 0x0');
    });

    it('registration success', async function () {
        for (const oracle of ORACLES_DATA) {
            await iterableOracles.registerOracle(oracle.owner, oracle.address, oracle.url);

            const oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
            expect(oracleRegistered).to.equal(true);

            const ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
            expect(ownerRegistered).to.equal(true);

            const { oracleAddress, url } = await iterableOracles.getOracleInfo(oracle.owner);
            expect(oracleAddress).to.equal(oracle.address);
            expect(url).to.equal(oracle.url);

            const owner = await iterableOracles.getOwner(oracle.address);
            expect(owner).to.equal(oracle.owner);
        }

        const length = await iterableOracles.getLen();
        expect(length).to.equal(BigInt(ORACLES_DATA.length));

        await expect(iterableOracles.getOracleAtIndex(Number(length))).to.be.revertedWith(
            'Illegal index',
        );

        const result = await iterableOracles.getOracleAtIndex(0);
        expect(result.ownerAddress).to.equal(ORACLES_DATA[0].owner);
        expect(result.oracleAddress).to.equal(ORACLES_DATA[0].address);
        expect(result.url).to.equal(ORACLES_DATA[0].url);
    });

    it('fail registration already registered', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];

        await expect(
            iterableOracles.registerOracle(
                oracle.owner,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ),
        ).to.be.revertedWith('Owner already registered');

        await expect(
            iterableOracles.registerOracle(dummy, oracle.address, 'https://example.org/oracle0'),
        ).to.be.revertedWith('Oracle already registered');
    });

    it('fail to change url', async function () {
        await expect(
            iterableOracles.setName(ADDRESS_ZERO, 'https://example.org/bad'),
        ).to.be.revertedWith('Oracle owner is not registered');
    });

    it('change url', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];
        const newName = 'https://example.org/setName';

        const { found, url: oldName } = await iterableOracles.getInternetName(oracle.owner);
        expect(found).to.equal(true);
        expect(oldName).to.equal(oracle.url);
        expect(oldName).to.not.equal(newName);

        await iterableOracles.setName(oracle.owner, newName);

        const { url: updatedName } = await iterableOracles.getInternetName(oracle.owner);
        expect(updatedName).to.equal(newName);
    });

    it('fail to change oracle address', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];

        await expect(
            iterableOracles.setOracleAddress(ADDRESS_ZERO, ADDRESS_ONE),
        ).to.be.revertedWith('Oracle owner is not registered');

        await expect(
            iterableOracles.setOracleAddress(oracle.owner, oracle.address),
        ).to.be.revertedWith('Oracle already registered');
    });

    it('change oracle address', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];
        const newAddress = addressFromNumber(100);

        const oldAddress = await iterableOracles.getOracleAddress(oracle.owner);
        expect(oldAddress).to.equal(oracle.address);
        expect(oldAddress).to.not.equal(newAddress);

        await iterableOracles.setOracleAddress(oracle.owner, newAddress);

        const updatedAddress = await iterableOracles.getOracleAddress(oracle.owner);
        expect(updatedAddress).to.equal(newAddress);
    });

    it('fail to get an invalid owner', async function () {
        expect(await iterableOracles.getOracleAddress(invalid)).to.equal(ADDRESS_ZERO);

        const { found } = await iterableOracles.getInternetName(invalid);
        expect(found).to.equal(false);
    });

    it('remove failure', async function () {
        await expect(iterableOracles.removeOracle(ADDRESS_ZERO)).to.be.revertedWith(
            'Owner address cannot be 0x0',
        );

        await expect(iterableOracles.removeOracle(ADDRESS_ONE)).to.be.revertedWith(
            'Owner not registered',
        );
    });

    it('remove success', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];

        let oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
        expect(oracleRegistered).to.equal(true);

        let ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
        expect(ownerRegistered).to.equal(true);

        await iterableOracles.removeOracle(oracle.owner);

        oracleRegistered = await iterableOracles.isOracleRegistered(oracle.address);
        expect(oracleRegistered).to.equal(false);

        ownerRegistered = await iterableOracles.isOwnerRegistered(oracle.owner);
        expect(ownerRegistered).to.equal(false);

        await expect(iterableOracles.removeOracle(oracle.owner)).to.be.revertedWith(
            'Owner not registered',
        );
    });
});
