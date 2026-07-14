import { defineConfig } from 'hardhat/config';
import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import tsTestHelperConf from 'ts-test-helpers/hardhat.config.ts';

const tsTestHelperHardhatConfig = tsTestHelperConf as {
    solidity: {
        npmFilesToBuild: string[];
    };
};

export default defineConfig({
    plugins: [hardhatToolboxViemPlugin, hardhatMocha],
    solidity: {
        compilers: [
            {
                version: '0.5.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.6.12',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.8.24',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                        details: {
                            yulDetails: {
                                optimizerSteps:
                                    'dhfoDgvulfnTUtnIf[xa[r]EscLMcCTUtTOntnfDIulLculVcul[j]Tpeulxa[rul]xa[r]cLgvifCTUca[r]LSsTOtfDnca[r]Iulc]jmul[jul]VcTOculjmul',
                            },
                        },
                    },
                    viaIR: true,
                },
            },
        ],
        npmFilesToBuild: [
            ...tsTestHelperHardhatConfig.solidity.npmFilesToBuild,
            '@moc/periphery/contracts/moc-governance/Governance/Governor.sol',
            '@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol',
            '@moc/periphery/contracts/test-and-mocks/GovernedERC20.sol',
            '@moc/periphery/contracts/test-and-mocks/MockGovernor.sol',
            '@moc/periphery/contracts/GovernedRegistry.sol',
        ],
    },
    networks: {
        default: {
            type: 'edr-simulated',
            accounts: {
                count: 60,
            },
        },
    },

    paths: {
        sources: './contracts',
        tests: './test',
    },
});
