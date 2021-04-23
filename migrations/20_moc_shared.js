const helpers = require('@money-on-chain/omoc-sc-shared/lib/helpers');

// FOR TRUFFLE
module.exports = helpers.sharedStep(['10_initial_migration', '2_init_openzepelin', '20_moc_gobernanza', '40_registry'], artifacts);
