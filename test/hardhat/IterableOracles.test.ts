import { expect } from 'chai';
import { network } from 'hardhat';
import { Address, getAddress, numberToHex } from 'viem';
import {
    assertSameAddress,
    Deployer,
    ContractOf,
    Viem,
    WalletClients,
    ADDRESS_ZERO,
    ADDRESS_ONE,
} from 'ts-test-helpers';
import { OracleDefinition } from './helpers.js';

function addressFromNumber(value: number): Address {
    return getAddress(numberToHex(value, { size: 20 }));
}

describe('IterableOracles', function () {
    let deployer: Deployer;
    let viem: Viem;
    let accounts: WalletClients;
    let iterableOracles: ContractOf<'IterableOraclesMock'>;

    let dummy: Address;
    let invalid: Address;

    let ORACLES_DATA: OracleDefinition[];

    beforeEach(async function () {
        ({ viem } = await network.create());
        deployer = await Deployer.default(viem);

        accounts = await viem.getWalletClients();

        dummy = accounts[0].account!.address;
        invalid = accounts[1].account!.address;

        ORACLES_DATA = [
            {
                owner: accounts[2],
                address: addressFromNumber(11),
                url: 'https://example.org/oracle11',
                name: 'oracle11',
            },
            {
                owner: accounts[3],
                address: addressFromNumber(12),
                url: 'https://example.org/oracle12',
                name: 'oracle12',
            },
            {
                owner: accounts[4],
                address: addressFromNumber(13),
                url: 'https://example.org/oracle13',
                name: 'oracle13',
            },
            {
                owner: accounts[5],
                address: addressFromNumber(14),
                url: 'https://example.org/oracle14',
                name: 'oracle14',
            },
        ];

        iterableOracles = await deployer.deploy('IterableOraclesMock');
    });

    async function registerOracles() {
        for (const { address, url, owner } of ORACLES_DATA) {
            await iterableOracles.write.registerOracle([owner.account!.address, address, url!]);
        }
    }

    it('fail registration zero address', async function () {
        await viem.assertions.revertWith(
            iterableOracles.write.registerOracle([
                ADDRESS_ZERO,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ]),
            'Owner address cannot be 0x0',
        );

        await viem.assertions.revertWith(
            iterableOracles.write.registerOracle([
                ADDRESS_ONE,
                ADDRESS_ZERO,
                'https://example.org/oracle0',
            ]),
            'Oracle address cannot be 0x0',
        );
    });

    it('registration success', async function () {
        for (const { owner, address, url } of ORACLES_DATA) {
            const ownerAddr = owner.account!.address;
            await iterableOracles.write.registerOracle([ownerAddr, address, url!]);

            const oracleRegistered = await iterableOracles.read.isOracleRegistered([address]);
            expect(oracleRegistered).to.equal(true);

            const ownerRegistered = await iterableOracles.read.isOwnerRegistered([ownerAddr]);
            expect(ownerRegistered).to.equal(true);

            const [oracleAddress, gotUrl] = await iterableOracles.read.getOracleInfo([ownerAddr]);
            assertSameAddress(oracleAddress, address);
            expect(gotUrl).to.equal(url);

            const gotOwner = await iterableOracles.read.getOwner([address]);
            assertSameAddress(gotOwner, ownerAddr);
        }

        const length = await iterableOracles.read.getLen();
        expect(length).to.equal(BigInt(ORACLES_DATA.length));

        await viem.assertions.revertWith(
            iterableOracles.read.getOracleAtIndex([length]),
            'Illegal index',
        );

        const [owner, address, url] = await iterableOracles.read.getOracleAtIndex([0n]);
        assertSameAddress(owner, ORACLES_DATA[0].owner.account!.address);
        assertSameAddress(address, ORACLES_DATA[0].address);
        expect(url).to.equal(ORACLES_DATA[0].url);
    });

    it('fail registration already registered', async function () {
        await registerOracles();

        const oracle = ORACLES_DATA[0];

        await viem.assertions.revertWith(
            iterableOracles.write.registerOracle([
                oracle.owner.account!.address,
                ADDRESS_ONE,
                'https://example.org/oracle0',
            ]),
            'Owner already registered',
        );

        await viem.assertions.revertWith(
            iterableOracles.write.registerOracle([
                dummy,
                oracle.address,
                'https://example.org/oracle0',
            ]),
            'Oracle already registered',
        );
    });

    it('fail to change url', async function () {
        await viem.assertions.revertWith(
            iterableOracles.write.setName([ADDRESS_ZERO, 'https://example.org/bad']),
            'Oracle owner is not registered',
        );
    });

    it('change url', async function () {
        await registerOracles();

        const { owner, url } = ORACLES_DATA[0];
        const newName = 'https://example.org/setName';
        const ownerAddress = owner.account!.address;

        const [found, oldName] = await iterableOracles.read.getInternetName([ownerAddress]);
        expect(found).to.equal(true);
        expect(oldName).to.equal(url);
        expect(oldName).to.not.equal(newName);

        await iterableOracles.write.setName([ownerAddress, newName]);

        const [_, updatedName] = await iterableOracles.read.getInternetName([ownerAddress]);
        expect(updatedName).to.equal(newName);
    });

    it('fail to change oracle address', async function () {
        await registerOracles();

        const { owner, address } = ORACLES_DATA[0];

        await viem.assertions.revertWith(
            iterableOracles.write.setOracleAddress([ADDRESS_ZERO, ADDRESS_ONE]),
            'Oracle owner is not registered',
        );

        await viem.assertions.revertWith(
            iterableOracles.write.setOracleAddress([owner.account!.address, address]),
            'Oracle already registered',
        );
    });

    it('change oracle address', async function () {
        await registerOracles();

        const { owner, address } = ORACLES_DATA[0];
        const newAddress = addressFromNumber(100);
        const ownerAddress = owner.account!.address;

        const oldAddress = await iterableOracles.read.getOracleAddress([ownerAddress]);
        assertSameAddress(oldAddress, address);

        await iterableOracles.write.setOracleAddress([ownerAddress, newAddress]);

        const updatedAddress = await iterableOracles.read.getOracleAddress([ownerAddress]);
        assertSameAddress(updatedAddress, newAddress);
    });

    it('fail to get an invalid owner', async function () {
        expect(await iterableOracles.read.getOracleAddress([invalid])).to.equal(ADDRESS_ZERO);

        const [found] = await iterableOracles.read.getInternetName([invalid]);
        expect(found).to.equal(false);
    });

    it('remove failure', async function () {
        await viem.assertions.revertWith(
            iterableOracles.write.removeOracle([ADDRESS_ZERO]),
            'Owner address cannot be 0x0',
        );

        await viem.assertions.revertWith(
            iterableOracles.write.removeOracle([ADDRESS_ONE]),
            'Owner not registered',
        );
    });

    it('remove success', async function () {
        await registerOracles();

        const { owner, address } = ORACLES_DATA[0];
        const ownerAddress = owner.account!.address;

        let oracleRegistered = await iterableOracles.read.isOracleRegistered([address]);
        expect(oracleRegistered).to.equal(true);

        let ownerRegistered = await iterableOracles.read.isOwnerRegistered([ownerAddress]);
        expect(ownerRegistered).to.equal(true);

        await iterableOracles.write.removeOracle([ownerAddress]);

        oracleRegistered = await iterableOracles.read.isOracleRegistered([address]);
        expect(oracleRegistered).to.equal(false);

        ownerRegistered = await iterableOracles.read.isOwnerRegistered([ownerAddress]);
        expect(ownerRegistered).to.equal(false);

        await viem.assertions.revertWith(
            iterableOracles.write.removeOracle([ownerAddress]),
            'Owner not registered',
        );
    });
});
