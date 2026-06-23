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
});
