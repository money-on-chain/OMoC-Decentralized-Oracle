const helpers = require('@moc/shared/lib/helpers');
const steps = ['2_init_openzepelin', '20_moc_gobernanza', '30_test_moc', '40_registry'];
// FOR TRUFFLE
module.exports = helpers.sharedStep(steps.map((s) => require('@moc/shared/migrations/' + s)));
