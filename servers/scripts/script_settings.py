from starlette.datastructures import Secret

from common.services.blockchain import BlockchainAccount
from common.services.contract_factory_service import BuildDirContractFactoryService, ContractFactoryService
from common.services.oracle_dao import CoinPair
from common.settings import config
# https://www.starlette.io/config/
from oracle.src import oracle_settings
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from oracle.src.oracle_service import OracleService

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

cf = BuildDirContractFactoryService()


async def configure_oracle():
    cf = ContractFactoryService.get_contract_factory_service()
    conf = OracleConfigurationLoop(cf)
    await conf.initialize()
    oracle_service = OracleService(cf, conf.ORACLE_MANAGER_ADDR)
    moc_token_service = cf.get_moc_token(await oracle_service.get_token_addr())
    oracle_manager_service = cf.get_oracle_manager(conf.ORACLE_MANAGER_ADDR)
    oracle_manager_addr = cf.get_addr("ORACLE_MANAGER")
    return conf, oracle_service, moc_token_service, oracle_manager_service, oracle_manager_addr


async def configure_supporter():
    cf = ContractFactoryService.get_contract_factory_service()
    conf = OracleConfigurationLoop(cf)
    await conf.initialize()
    supporters_service = cf.get_supporters(conf.SUPPORTERS_VESTED_ADDR)
    moc_token_service = cf.get_moc_token(await supporters_service.get_token_addr())
    return conf, supporters_service, moc_token_service
