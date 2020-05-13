import json
from decimal import Decimal

from starlette.datastructures import Secret

from common.services.blockchain import BlockchainAccount
from common.settings import config

# Port in which the oracle listen for sign request
ORACLE_PORT = config('ORACLE_PORT', cast=int, default=5556)

# Run the oracle server
ORACLE_RUN = config('ORACLE_RUN', cast=bool, default=True)

# Flag that indicates if the monitor (a module that store information in logfiles) must be run
ORACLE_MONITOR_RUN = config('ORACLE_MONITOR_RUN', cast=bool, default=False)

# Run the oracle round scheduler?
SCHEDULER_RUN_ORACLE_SCHEDULER = config('SCHEDULER_RUN_ORACLE_SCHEDULER', cast=bool, default=True)

# Run the supporters round scheduler?
SCHEDULER_RUN_SUPPORTERS_SCHEDULER = config('SCHEDULER_RUN_SUPPORTERS_SCHEDULER', cast=bool, default=True)

# Monitor : Log exchange prices file name
ORACLE_MONITOR_LOG_EXCHANGE_PRICE = config('ORACLE_MONITOR_LOG_EXCHANGE_PRICE', cast=str, default="exchanges.log")

# Monitor : Log published prices file name
ORACLE_MONITOR_LOG_PUBLISHED_PRICE = config('ORACLE_MONITOR_LOG_PUBLISHED_PRICE', cast=str, default="published.log")

# If configured (json array of strings) only publish for those coinpairs in the list
ORACLE_COIN_PAIR_FILTER = json.loads(config('ORACLE_COIN_PAIR_FILTER', cast=str, default="[]"))

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


def get_oracle_account() -> BlockchainAccount:
    return BlockchainAccount(config('ORACLE_ADDR', cast=str),
                             config('ORACLE_PRIVATE_KEY', cast=Secret))


def get_oracle_scheduler_account() -> BlockchainAccount:
    return get_oracle_account()


def get_supporters_scheduler_account() -> BlockchainAccount:
    return get_oracle_account()
