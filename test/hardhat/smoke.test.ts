import { expect } from 'chai';
import { network } from 'hardhat';

describe('Hardhat setup', function () {
    it('loads signers', async function () {
        const { ethers } = await network.create();

        const [deployer] = await ethers.getSigners();

        expect(deployer.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
});
