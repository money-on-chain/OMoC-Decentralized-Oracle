import logging
import typing
from decimal import Decimal
from enum import Enum

from common import settings
from common.bg_task_executor import BgTaskExecutor
from common.helpers import parseTimeDelta
from common.services.blockchain import is_error
from common.services.contract_factory_service import ContractFactoryService
from common.settings import config

logger = logging.getLogger(__name__)

OracleTurnConfiguration = typing.NamedTuple("OracleTurnConfiguration",
                                            [("stake_limit_multiplicator", int),
                                             ("price_fallback_delta_pct", int),
                                             ("price_fallback_blocks", int),
                                             ("price_publish_blocks", int),
                                             ])


class OracleConfigurationLoop(BgTaskExecutor):
    class Order(Enum):
        blockchain_configuration_default = 1
        configuration_blockchain_default = 2
        configuration_default_blockchain = 3

    def __init__(self, cf: ContractFactoryService):
        registry_addr = config('ORACLE_REGISTRY_ADDR', cast=str, default=cf.get_addr("ETERNAL_STORAGE"))
        if registry_addr is None:
            raise ValueError("Missing ORACLE_REGISTRY_ADDR!!!")
        self._eternal_storage_service = cf.get_eternal_storage(registry_addr)
        supporters_vested_addr = None
        oracle_manager_addr = None
        if settings.DEVELOP:
            supporters_vested_addr = cf.get_addr("SUPPORTERS")
            oracle_manager_addr = cf.get_addr("ORACLE_MANAGER")

        self.parameters = {
            "SUPPORTERS_VESTED_ADDR": {
                "priority": self.Order.configuration_default_blockchain,
                "configuration": lambda: config('SUPPORTERS_VESTED_ADDR', cast=str),
                "blockchain": lambda p: self._eternal_storage_service.get_address(p),
                "description": "Supporters vested address, called by scheduler",
                "default": supporters_vested_addr
            },
            "ORACLE_MANAGER_ADDR": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_MANAGER_ADDR', cast=str),
                "blockchain": lambda p: self._eternal_storage_service.get_address(p),
                "description": "Oracle manager address, used in OracleLoop to get coin"
                               "pairs and CoinPairPrice addresses",
                "default": oracle_manager_addr

            },
            "ORACLE_PRICE_FETCH_RATE": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_PRICE_FETCH_RATE', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Exchange price-fetch rate in seconds, all the exchanges are queried at the same time.",
                "default": 5
            },
            "ORACLE_BLOCKCHAIN_INFO_INTERVAL": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_BLOCKCHAIN_INFO_INTERVAL', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "This loop collect a lot of information needed for validation (like last pub block)"
                               " from the block chain",
                "default": 3,
            },
            "ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Per coin pair loop scanning interval, in which we try to publish",
                "default": 5,
            },
            "ORACLE_MAIN_LOOP_TASK_INTERVAL": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_MAIN_LOOP_TASK_INTERVAL', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Main Oracle loop scanning interval, in which we get the coinpair list",
                "default": 120,
            },
            "ORACLE_PRICE_REJECT_DELTA_PCT": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_PRICE_REJECT_DELTA_PCT', cast=Decimal),
                "blockchain": lambda p: self._eternal_storage_service.get_decimal(p),
                "description": "If the price delta percentage is grater than this we reject by not signing",
                "default": Decimal("50"),
            },
            "ORACLE_CONFIGURATION_TASK_INTERVAL": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_CONFIGURATION_TASK_INTERVAL', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Configuration Oracle loop scanning interval, in which we get configuration info",
                "default": 240,
            },
            "ORACLE_GATHER_SIGNATURE_TIMEOUT": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('ORACLE_GATHER_SIGNATURE_TIMEOUT', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Timeout used when requesting signatures fom other oracles",
                "default": 60,
            },
            "SCHEDULER_POOL_DELAY": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('SCHEDULER_POOL_DELAY', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Delay in which the scheduler checks for round change conditions",
                "default": 10,
            },
            "SCHEDULER_ROUND_DELAY": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: parseTimeDelta(config('SCHEDULER_ROUND_DELAY', cast=str)),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Delay in which the scheduler checks for round change after a round was closed",
                "default": 60 * 60 * 24,
            },
            "ORACLE_PRICE_DIGITS": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_PRICE_DIGITS', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Timeout used when requesting signatures fom other oracles",
                "default": 18,
            },
            "ORACLE_QUEUE_LEN": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_QUEUE_LEN', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Size of the queue used to save historical exchange prices",
                "default": 30,
            },
            "MESSAGE_VERSION": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('MESSAGE_VERSION', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Version field of the message that is send to the blockchain",
                "default": 3,
            },
            "ORACLE_STAKE_LIMIT_MULTIPLICATOR": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_STAKE_LIMIT_MULTIPLICATOR', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "This is used to limit the difference in participation between selected oracles,"
                               "the maximum stake used is the minimum multiplied by this factor"
                               "(even if some oracle has more stake participating)",
                "default": 2,
            },
            "ORACLE_PRICE_FALLBACK_DELTA_PCT": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_PRICE_FALLBACK_DELTA_PCT', cast=Decimal),
                "blockchain": lambda p: self._eternal_storage_service.get_decimal(p),
                "description": "If the price delta percentage has changed and more than"
                               " ORACLE_PRICE_FALLBACK_BLOCKS pass we act as fallbacks.",
                "default": Decimal("0.05"),
            },
            "ORACLE_PRICE_PUBLISH_BLOCKS": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_PRICE_PUBLISH_BLOCKS', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Selected oracle publishes after  ORACLE_PRICE_PUBLISH_BLOCKS  blocks of a price change.",
                "default": 1,
            },
            "ORACLE_PRICE_FALLBACK_BLOCKS": {
                "priority": self.Order.configuration_blockchain_default,
                "configuration": lambda: config('ORACLE_PRICE_FALLBACK_BLOCKS', cast=int),
                "blockchain": lambda p: self._eternal_storage_service.get_uint(p),
                "description": "Fallback oracle try to publish ORACLE_PRICE_FALLBACK_BLOCKS  blocks after price change.",
                "default": 2,
            },
        }
        self.from_conf = set()
        self.from_default = set()
        self.values = dict()
        super().__init__(self.run)

    def __getattr__(self, name):
        if name in self.values:
            return self.values[name]
        raise AttributeError("OracleConfigurationLoop has no attribute '%s'" % name)

    def __dir__(self):
        return self.mapping.keys()

    async def initialize(self):
        for (p, param) in self.parameters.items():
            val = None
            if val is None and "configuration" in param:
                try:
                    val = param["configuration"]()
                    self.from_conf.add(p)
                    logger.info("Setting parameter %r from environ -> %r" % (p, val))
                except KeyError:
                    pass
                except (TypeError, ValueError) as err:
                    logger.error("Error getting key %s from environ %r" % (p, err))

            if val is None and "default" in param and param["default"] is not None:
                val = param["default"]
                self.from_default.add(p)
                logger.info("Setting parameter %r from default -> %r" % (p, val))

            if val is None:
                val = await self._get_from_blockchain(p, param)

            if val is None:
                raise ValueError("Missing value %s" % p)
            self.values[p] = val

    async def run(self):
        logger.info("Configuration loop start")
        for (p, param) in self.parameters.items():
            val = await self._get_from_blockchain(p, param)
            if val is not None and self.values[p] != val:
                logger.info("Setting param %r from blockchain registry -> %r" % (p, val))
                self.values[p] = val
        logger.info("Configuration loop done")
        return self.ORACLE_CONFIGURATION_TASK_INTERVAL

    async def _get_from_blockchain(self, p, param):
        if p in self.from_conf and param["priority"] == self.Order.configuration_blockchain_default:
            return None
        if p in self.from_default and param["priority"] == self.Order.configuration_default_blockchain:
            return None
        p_path = self.get_registry_path(p)
        val = await param["blockchain"](p_path)
        if is_error(val):
            msg = "Error getting param from blockchain %r -> %r" % (p, val)
            if not p in self.values or self.values[p] is None:
                logger.error(msg)
            else:
                logger.warning(msg)
            return None
        return val

    @staticmethod
    def get_registry_path(param_name):
        version = 1
        return "MOC_ORACLE\\%s\\%s" % (version, param_name)

    @property
    def oracle_turn_conf(self):
        return OracleTurnConfiguration(self.ORACLE_STAKE_LIMIT_MULTIPLICATOR, self.ORACLE_PRICE_FALLBACK_DELTA_PCT,
                                       self.ORACLE_PRICE_FALLBACK_BLOCKS, self.ORACLE_PRICE_PUBLISH_BLOCKS)
