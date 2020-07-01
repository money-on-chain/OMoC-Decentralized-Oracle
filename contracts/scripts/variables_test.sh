export DEFAULT_VALIDPRICEPERIODINBLOCKS=180
export DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS=160

export DEFAULT_MAXORACLESPERROUND=10
export DEFAULT_BOOTSTRAPPRICE='1000000000000000'
export DEFAULT_MINORACLEOWNERSTAKE='10000000000'
export DEFAULT_NUMIDLEROUNDS=2

CurrencyPair+="BTCUSD;"
roundLockPeriodInBlocks+="200;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

CurrencyPair+="RIFBTC;"
roundLockPeriodInBlocks+="300;"
validPricePeriodInBlocks+="$DEFAULT_VALIDPRICEPERIODINBLOCKS;"
emergencyPublishingPeriodInBlocks+="$DEFAULT_EMERGENCYPUBLISHPERIODINBLOCKS;"
minOracleOwnerStake+="$DEFAULT_MINORACLEOWNERSTAKE;"
maxOraclesPerRound+="$DEFAULT_MAXORACLESPERROUND;"
bootstrapPrice+="$DEFAULT_BOOTSTRAPPRICE;"
numIdleRounds+="$DEFAULT_NUMIDLEROUNDS;"

supportersEarnPeriodInBlocks=360
supportersAfterStopBlocks=90
supportersMinStayBlocks=30

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
