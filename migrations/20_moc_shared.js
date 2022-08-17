const helpers = require('@moc/shared/lib/helpers');
const steps = ['2_init_openzepelin', '20_moc_gobernanza', '40_registry'];
// FOR TRUFFLE
module.exports = helpers.sharedStep(
    steps.map((s) => require('@moc/shared/migrations/' + s)),
    artifacts,
);
