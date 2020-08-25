const Migrations = artifacts.require('Migrations');
const helpers = require('./helpers');

module.exports = function (deployer) {
    if (helpers.is_test()) return;
    deployer.deploy(Migrations);
};
