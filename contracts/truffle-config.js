// Use dotenv file
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const HDWalletProvider = require('truffle-hdwallet-provider-privkey');
const helpers = require('./migrations/helpers');

// VERY IMPORTANT, if this number is too big: near gasLimit (the default) transaction are QUEUED for
// a long time, on the other hand if it is too small some big transactions can fail!!!
// Tune it to your needs.
const GAS_LIMIT = 2 * 1000 * 1000;

if (helpers.is_production()) console.log('USING OPTIMIZER!!!');

// Skip stress tests, except when they are running directly.
let skip_slow = helpers.run_slow_tests() ? {} : {grep: '@slow', invert: true};

// Check that we have all the needed env vars!!!
helpers.config();

// const HDWalletProvider = require('truffle-hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();
module.exports = {
    /**
     * Networks define how you connect to your ethereum client and let you set the
     * defaults web3 uses to send transactions. If you don't specify one truffle
     * will spin up a development blockchain for you on port 9545 when you
     * run `develop` or `test`. You can ask a truffle command to use a specific
     * network from the command line, e.g
     *
     * $ truffle test --network <network-name>
     */
    networks: {
        // Useful for testing. The `development` name is special - truffle uses it by default
        // if it's defined here and no other network is specified at the command line.
        // You should run a client (like ganache-cli, geth or parity) in a separate terminal
        // tab if you use this network and you must also set the `host`, `port` and `network_id`
        // options below to some value.
        //
        development: {
            host: '127.0.0.1', // Localhost (default: none)
            port: 8545, // Standard Ethereum port (default: none)
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },
        ganache_deploy: {
            host: '127.0.0.1', // Localhost (default: none)
            port: 8545, // Standard Ethereum port (default: none)
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },
        rsk_regtest: {
            host: '127.0.0.1',
            port: 4444,
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },
        rinkeby: {
            from: '0x54a671DEe6E72771A08ee14AE30823eb5cD90AA7',
            provider: () => {
                return new HDWalletProvider(
                    [process.env.PRIVATE_KEY],
                    'https://rinkeby.infura.io/v3/969e1fd3ca714562b67169f695159e1a',
                );
            },
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },
        e2e_test: {
            host: '127.0.0.1',
            port: 5656,
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },
        rsk_testnet: {
            from: '0x54a671DEe6E72771A08ee14AE30823eb5cD90AA7',
            networkCheckTimeout: 1000000,
            provider: () => {
                return new HDWalletProvider(
                    [process.env.PRIVATE_KEY],
                    'https://public-node.testnet.rsk.co',
                );
            },
            gasPrice: 59240000,
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: false,
        },
        rsk_nodes: {
            from: '0x54a671DEe6E72771A08ee14AE30823eb5cD90AA7',
            networkCheckTimeout: 1000000,
            provider: () => {
                return new HDWalletProvider([process.env.PRIVATE_KEY], 'http://rsknodes:4446');
            },
            gasPrice: 59240000,
            gas: GAS_LIMIT,
            network_id: '*', // Any network (default: none)
            skipDryRun: true,
        },

        // Useful for deploying to a public network.
        // NB: It's important to wrap the provider as a function.
        // ropsten: {
        // provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/YOUR-PROJECT-ID`),
        // network_id: 3,       // Ropsten's id
        // gas: 5500000,        // Ropsten has a lower block limit than mainnet
        // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
        // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
        // production: true    // Treats this network as if it was a public net. (default: false)
        // }
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'USD',
            // gasPrice: 20,
        },
        ...skip_slow,
        // timeout: 100000
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: '0.6.12', // Fetch exact version from solc-bin (default: truffle's version)
            // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
            settings: {
                // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    // default network doesn't use optimizer, the rest use it.
                    enabled: helpers.is_production(),
                    runs: 200,
                },
                //  evmVersion: "byzantium"
            },
        },
    },
    plugins: ['solidity-coverage'],
};
