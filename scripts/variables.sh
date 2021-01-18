export PRIVATE_KEY=94b9259bc456cba42b9cc7dc3982f94492645a925dbcceeb94b9e49878c7cdd2
export NETWORK_BLOCK_RATE_PER_SEC=30
export SECONDS_PER_DAY=86400
export AVERAGE_BLOCKS_PER_DAY=$(($SECONDS_PER_DAY / $NETWORK_BLOCK_RATE_PER_SEC))

export ROUND_PERIOD_DAYS=30
export DEFAULT_ROUNDLOCKPERIODINSECS=$(($AVERAGE_BLOCKS_PER_DAY * $ROUND_PERIOD_DAYS))
export DEFAULT_VALIDPRICEPERIODINBLOCKS=180
export DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS=160

export DEFAULT_MINORACLESPERROUND=3
export DEFAULT_MAXORACLESPERROUND=10
export DEFAULT_MAXSUBSCRIBEDORACLESPERROUND=30
export DEFAULT_BOOTSTRAPPRICE='1000000000000000'
export DEFAULT_MINORACLEOWNERSTAKE='10000000000'
export DEFAULT_NUMIDLEROUNDS=2

CurrencyPair="BTCUSD;"
roundLockPeriodInSecs+="$DEFAULT_ROUNDLOCKPERIODINSECS;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
minOraclesPerRound+="$DEFAULT_MINORACLESPERROUND;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
maxSubscribedOraclesPerRound+="$DEFAULT_MAXSUBSCRIBEDORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

CurrencyPair+="RIFBTC;"
roundLockPeriodInSecs+="$DEFAULT_ROUNDLOCKPERIODINSECS;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
minOraclesPerRound+="$DEFAULT_MINORACLESPERROUND;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
maxSubscribedOraclesPerRound+="$DEFAULT_MAXSUBSCRIBEDORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

supportersEarnPeriodInBlocks=129600
supportersAfterStopBlocks=129600
supportersMinStayBlocks=8640

export CurrencyPair
export roundLockPeriodInSecs
export validPricePeriodInBlocks
export emergencyPublishingPeriodInBlocks
export minOracleOwnerStake
export minOraclesPerRound
export maxOraclesPerRound
export maxSubscribedOraclesPerRound
export bootstrapPrice
export numIdleRounds
export supportersEarnPeriodInBlocks
export supportersAfterStopBlocks
export supportersMinStayBlocks
