const helpers = require('@moc/shared/lib/helpers');

// FOR TRUFFLE
module.exports = helpers.sharedStep(require('@moc/shared/migrations/10_initial_migration'));
