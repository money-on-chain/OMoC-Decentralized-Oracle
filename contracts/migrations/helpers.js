function config() {
    const vars = ["PRIVATE_KEY", "CurrencyPair", "minOracleOwnerStake", "maxOraclesPerRound",
        "bootstrapPrice", "numIdleRounds", "roundLockPeriodInBlocks",
        "validPricePeriodInBlocks", "emergencyPublishingPeriodInBlocks",
        "supportersEarnPeriodInBlocks", "supportersMinStayBlocks", "supportersAfterStopBlocks"];

    if (vars.some(x => !process.env[x])) {
        console.error("The script must be configured with .env file some parameter is missing, see dotenv_example");
        console.error(vars);
        process.exit();
    }

    function parseEnvArray(str) {
        return str.split(";").map(x => x.trim()).filter(x => x.length != 0);
    }

    //import variables
    const params = {
        CurrencyPair: parseEnvArray(process.env.CurrencyPair),
        minOracleOwnerStake: parseEnvArray(process.env.minOracleOwnerStake),
        maxOraclesPerRound: parseEnvArray(process.env.maxOraclesPerRound),
        bootstrapPrice: parseEnvArray(process.env.bootstrapPrice),
        numIdleRounds: parseEnvArray(process.env.numIdleRounds),
        roundLockPeriodInBlocks: parseEnvArray(process.env.roundLockPeriodInBlocks),
        validPricePeriodInBlocks: parseEnvArray(process.env.validPricePeriodInBlocks),
        emergencyPublishingPeriodInBlocks: parseEnvArray(process.env.emergencyPublishingPeriodInBlocks),
        supportersEarnPeriodInBlocks: process.env.supportersEarnPeriodInBlocks,
        supportersMinStayBlocks: process.env.supportersMinStayBlocks,
        supportersAfterStopBlocks: process.env.supportersAfterStopBlocks
    }
    console.log("Contracts configuration", params);
    return params;
}

module.exports.config = config;

function is_production() {
    return process.argv.some(x => x.trim() == "--network")
}

module.exports.is_production = is_production;

function is_test() {
    const ret = process.argv.some(x => x === 'test')
        || process.argv.some(x => x === 'coverage');
    if (ret) {
        console.log("SKIPING MIGRATIONS FOR TEST");
    }
    return ret;
}

module.exports.is_test = is_test;


function run_slow_tests() {
    return process.argv.some(x => x.toLowerCase().indexOf("stress") >= 0)
}

module.exports.run_slow_tests = run_slow_tests;
