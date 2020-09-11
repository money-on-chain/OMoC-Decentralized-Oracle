'use strict';
const helpers = require('@moc/shared/lib/helpers');
const NEEDED = [
    'coinPairs',
    'minCPSubscriptionStake',
    'supportersEarnPeriodInBlocks',
    'supportersEarnPeriodInBlocks',
];

async function deploy({config}) {
    if (helpers.isProduction() && !process.env.PRIVATE_KEY) {
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