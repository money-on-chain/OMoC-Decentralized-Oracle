export NETWORK_BLOCK_RATE_PER_SEC=30
export SECONDS_PER_DAY=86400
export AVERAGE_BLOCKS_PER_DAY=$(($SECONDS_PER_DAY / $NETWORK_BLOCK_RATE_PER_SEC))

export ROUND_PERIOD_DAYS=30
export DEFAULT_ROUNDLOCKPERIODINBLOCKS=$(($AVERAGE_BLOCKS_PER_DAY * $ROUND_PERIOD_DAYS))
export DEFAULT_VALIDPRICEPERIODINBLOCKS=180
export DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS=160

export DEFAULT_MAXORACLESPERROUND=10
export DEFAULT_BOOTSTRAPPRICE='1000000000000000'
export DEFAULT_MINORACLEOWNERSTAKE='10000000000'
export DEFAULT_NUMIDLEROUNDS=2

CurrencyPair="BTCUSD;"
roundLockPeriodInBlocks+="$DEFAULT_ROUNDLOCKPERIODINBLOCKS;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

CurrencyPair+="RIFBTC;"
roundLockPeriodInBlocks+="$DEFAULT_ROUNDLOCKPERIODINBLOCKS;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

supportersEarnPeriodInBlocks=129600
supportersAfterStopBlocks=129600
supportersMinStayBlocks=8640

export CurrencyPair
export roundLockPeriodInBlocks
export validPricePeriodInBlocks
export emergencyPublishingPeriodInBlocks
export minOracleOwnerStake
export maxOraclesPerRound
export bootstrapPrice
export numIdleRounds
export supportersEarnPeriodInBlocks
export supportersAfterStopBlocks
export supportersMinStayBlocks
