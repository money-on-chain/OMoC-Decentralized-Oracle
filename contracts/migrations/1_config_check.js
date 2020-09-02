'use strict';
const path = require('path');
const rootDir = path.resolve(process.cwd(), '..');
require('dotenv').config({path: path.resolve(rootDir, '.env')});
const helpers = require('@moc/shared/lib/helpers');

const NEEDED = ['coinPairs', 'minCPSubscriptionStake', 'supportersEarnPeriodInBlocks'];

async function deploy({config}) {
    if (!process.env.PRIVATE_KEY) {
        console.error('PRIVATE KEY MUST BE CONFIGURED IN ENV FILE OR VARIABLE');
        process.exit();
    }
    if (!config.stakingMachine) {
        console.error('stakingMachine must be configured in truffle config network entry');
        process.exit();
    }
    NEEDED.forEach((a) => {
        if (!config.stakingMachine[a]) {
            console.error(`stakingMachine.${a} must be configured in truffle config network entry`);
            process.exit();
        }
    });
}

// FOR TRUFFLE
module.exports = helpers.truffleMain(deploy);
