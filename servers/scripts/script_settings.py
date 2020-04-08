from starlette.datastructures import Secret

from common.services.blockchain import BlockchainAccount
from common.services.oracle_dao import CoinPair
from common.settings import config
# https://www.starlette.io/config/
from oracle.src import oracle_settings

USE_COIN_PAIR = [CoinPair("BTCUSD"), CoinPair("RIFBTC")]
SCHEDULER_ACCOUNT = BlockchainAccount(oracle_settings.SCHEDULER_SIGNING_ADDR,
                                      oracle_settings.SCHEDULER_SIGNING_KEY)

INITIAL_STAKE = 5 * (10 ** 12)
NEEDED_GAS = 5 * (10 ** 12)
REWARDS = 123
ORACLE_OWNER_ACCOUNT = BlockchainAccount(config('ORACLE_OWNER_ADDR', cast=str),
                                         config('ORACLE_OWNER_PRIVATE_KEY', cast=Secret))

PRICE_FETCHER_OWNER_ACCOUNT = BlockchainAccount(config('PRICE_FETCHER_OWNER_ADDR', cast=str),
                                                config('PRICE_FETCHER_OWNER_KEY', cast=Secret))
NEEDED_APROVE_BAG = 1000000000000000
