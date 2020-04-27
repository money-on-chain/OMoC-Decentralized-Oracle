import json
from decimal import Decimal

from starlette.datastructures import Secret

from common.helpers import parseTimeDelta
from common.services.blockchain import BlockchainAccount
from common.settings import config


def get_oracle_account():
    return BlockchainAccount(config('ORACLE_ADDR', cast=str),
                             config('ORACLE_PRIVATE_KEY', cast=Secret))


MESSAGE_VERSION = 3

# Run the oracle server
ORACLE_RUN = config('ORACLE_RUN', cast=bool, default=True)

# Port in which the oracle listen for sign request
ORACLE_PORT = config('ORACLE_PORT', cast=int, default=5556)
# Flag that indicates if the monitor (a module that store information in logfiles) must be run
ORACLE_MONITOR = config('ORACLE_MONITOR', cast=bool, default=False)
# Monitor : Log exchange prices file name
ORACLE_MONITOR_LOG_EXCHANGE_PRICE = config('ORACLE_MONITOR_LOG_EXCHANGE_PRICE', cast=str, default="exchanges.log")
# Monitor : Log published prices file name
ORACLE_MONITOR_LOG_PUBLISHED_PRICE = config('ORACLE_MONITOR_LOG_PUBLISHED_PRICE', cast=str, default="published.log")

# Exchange price- etch rate in seconds, all the exchanges are queried at the same time.
ORACLE_PRICE_FETCH_RATE = parseTimeDelta(config('ORACLE_PRICE_FETCH_RATE', cast=str, default="5 secs"))
# This loop collect a lot of information needed for validation (like last pub block) from the block chain
ORACLE_BLOCKCHAIN_INFO_INTERVAL = parseTimeDelta(config('ORACLE_BLOCKCHAIN_INFO_INTERVAL', cast=str, default="3 secs"))
# Per coin pair loop scanning interval, in which we try to publish
ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = parseTimeDelta(
    config('ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL', cast=str, default="5 secs"))
# Main Oracle loop scanning interval, in which we get the coinpair list
ORACLE_MAIN_LOOP_TASK_INTERVAL = parseTimeDelta(config('ORACLE_MAIN_LOOP_TASK_INTERVAL', cast=str, default="120 secs"))

# If the price delta percentage is grater than this we reject by not signing
ORACLE_PRICE_REJECT_DELTA_PCT = config('ORACLE_PRICE_REJECT_DELTA_PCT', cast=float, default=50)
# If the price delta percentage has changed and more than ORACLE_PRICE_FALLBACK_BLOCKS pass we act as fallbacks.
ORACLE_PRICE_FALLBACK_DELTA_PCT = config('ORACLE_PRICE_FALLBACK_DELTA_PCT', cast=float, default=0.05)
# Selected oracle publishes after  ORACLE_PRICE_PUBLISH_BLOCKS  blocks of a price change.
ORACLE_PRICE_PUBLISH_BLOCKS = config('ORACLE_PRICE_PUBLISH_BLOCKS', cast=int, default=1)
# Fallback oracle try to publish ORACLE_PRICE_FALLBACK_BLOCKS  blocks after price change.
ORACLE_PRICE_FALLBACK_BLOCKS = config('ORACLE_PRICE_FALLBACK_BLOCKS', cast=int, default=3)

# Timeout used when requesting signatures fom other oracles
ORACLE_GATHER_SIGNATURE_TIMEOUT = parseTimeDelta(config('ORACLE_GATHER_SIGNATURE_TIMEOUT', cast=str, default="2 secs"))
# Number of digit in which gathered prices are stored (wei)
ORACLE_PRICE_DIGITS = 18
# This is used to limit the difference in participation between selected oracles, the maximum stake used
# is the minimum multiplied by this factor (even if some oracle has more stake participating)
ORACLE_STAKE_LIMIT_MULTIPLICATOR = config('ORACLE_STAKE_LIMIT_MULTIPLICATOR', cast=int, default=2)

# Exchange price engines
ORACLE_PRICE_ENGINES = {
    "BTCUSD": [
        {"name": "bitstamp", "ponderation": Decimal(0.1917841725), "min_volume": 0.0, "max_delay": 0},
        {"name": "bitfinex", "ponderation": Decimal(0.1867488738), "min_volume": 0.0, "max_delay": 0},
        {"name": "kraken", "ponderation": Decimal(0.1608109123), "min_volume": 0.0, "max_delay": 0},
        {"name": "coinbase", "ponderation": Decimal(.2349963137), "min_volume": 0.0, "max_delay": 0},
        {"name": "gemini", "ponderation": Decimal(0.0880212588), "min_volume": 0.0, "max_delay": 0},
        {"name": "okcoin", "ponderation": Decimal(0.06801454943), "min_volume": 0.0, "max_delay": 0},
        {"name": "itbit", "ponderation": Decimal(0.06962391956), "min_volume": 0.0, "max_delay": 0}
    ],
    "RIFBTC": [
        {"name": "bitfinex_rif", "ponderation": Decimal(0.5), "min_volume": 0.0, "max_delay": 0},
        {"name": "bithumbpro_rif", "ponderation": Decimal(0.5), "min_volume": 0.0, "max_delay": 0},
    ]
}

# If configured (json array of strings) only publish for those coinpairs in the list
ORACLE_COIN_PAIR_FILTER = json.loads(config('ORACLE_COIN_PAIR_FILTER', cast=str, default="[]"))

# Size of the queue used to save historical exchange prices
ORACLE_QUEUE_LEN = 30

# Account used to manage (oracle and supproters ) rounds (start/close)
SCHEDULER_SIGNING_ADDR = config('SCHEDULER_SIGNING_ADDR', cast=str)
SCHEDULER_SIGNING_KEY = config('SCHEDULER_SIGNING_KEY', cast=Secret)

# Delay in which the scheduler checks for round change conditions
SCHEDULER_POOL_DELAY = parseTimeDelta(config('SCHEDULER_POOL_DELAY', cast=str, default="10 secs"))

# Delay in which the scheduler checks for round change after a round was closed
SCHEDULER_ROUND_DELAY = parseTimeDelta(config('SCHEDULER_ROUND_DELAY', cast=str, default="1 days"))

# Run the oracle round scheduler?
SCHEDULER_RUN_ORACLE_SCHEDULER = config('SCHEDULER_RUN_ORACLE_SCHEDULER', cast=bool, default=True)

# Run the supporters round scheduler?
SCHEDULER_RUN_SUPPORTERS_SCHEDULER = config('SCHEDULER_RUN_SUPPORTERS_SCHEDULER', cast=bool, default=True)
