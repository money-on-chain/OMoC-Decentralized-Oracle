const {SimpleProject} = require("@openzeppelin/upgrades/lib/project/SimpleProject");

const {files, scripts, ConfigManager, stdout} = require('@openzeppelin/cli');
const fs = require('fs');
const path = require('path');

async function truffle_main(deployer, networkName, accounts) {
    const dir = path.resolve(__dirname, '..', '.openzeppelin')
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // name, version, publish, dependencies, installDependencies, force, projectFile, typechainEnabled, typechainOutdir, typechainTarget
    await scripts.init({
        name: "MOCOraculos",
        version: "1.0.0",
        force: true
    });
    // network, from, timeout, blockTimeout, close, expires,
    await scripts.session({timeout: 7500, network: networkName})
};

// FOR TRUFFLE
module.exports = truffle_main

