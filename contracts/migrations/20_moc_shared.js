/* global artifacts  */
// const { Contracts } = require('@openzeppelin/upgrades');
const helpers = require('@moc/shared/lib/helpers');

// FOR TRUFFLE
module.exports = helpers.sharedStep([
    '@moc/shared/migrations/2_init_openzepelin',
    '@moc/shared/migrations/20_moc_gobernanza',
    '@moc/shared/migrations/30_registry',
]);
