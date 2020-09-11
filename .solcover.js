module.exports = {
    skipFiles: ['openzeppelin', 'change', 'moc-gobernanza', 'testing_mocks'],
    providerOptions: {
        default_balance_ether: '100000000000000000000',
        total_accounts: 20,
        mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect',
    },
    mocha: {
        grep: '@skip-on-coverage', // Find everything with this tag
        invert: true, // Run the grep's inverse set.
    },
};
