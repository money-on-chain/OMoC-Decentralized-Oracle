from starlette.datastructures import Secret

from common.services.blockchain import BlockchainAccount
from common.services.ethernal_storage_service import EternalStorageService
from common.services.oracle_dao import CoinPair
from common.settings import config
# https://www.starlette.io/config/
from oracle.src import oracle_settings
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop

USE_COIN_PAIR = [CoinPair("BTCUSD"), CoinPair("RIFBTC")]
INITIAL_STAKE = 5 * (10 ** 12)
NEEDED_GAS = 5 * (10 ** 12)
REWARDS = 123

SCRIPT_ORACLE_OWNER_ACCOUNT = BlockchainAccount(config('SCRIPT_ORACLE_OWNER_ADDR', cast=str),
                                                config('SCRIPT_ORACLE_OWNER_PRIVATE_KEY', cast=Secret))
SCRIPT_REWARD_BAG_ACCOUNT = BlockchainAccount(config('SCRIPT_REWARD_BAG_ADDR', cast=str),
                                              config('SCRIPT_REWARD_BAG_PRIVATE_KEY', cast=Secret))
SCRIPT_ORACLE_ACCOUNT = oracle_settings.get_oracle_account()

NEEDED_APROVE_BAG = 1000000000000000


async def configure():
    conf = OracleConfigurationLoop(EternalStorageService(oracle_settings.get_registry_addr()))
    await conf.initialize()
    return conf
