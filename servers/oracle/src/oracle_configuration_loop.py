import logging
import typing

from common.bg_task_executor import BgTaskExecutor
from common.helpers import parseTimeDelta
from common.services.ethernal_storage_service import EternalStorageService
from common.settings import config

logger = logging.getLogger(__name__)

OracleConfiguration = typing.NamedTuple("OracleConfiguration",
                                        [("bla", str),
                                         ])

OracleTurnConfiguration = typing.NamedTuple("OracleTurnConfiguration",
                                            [("stake_limit_multiplicator", int),
                                             ("price_fallback_delta_pct", float),
                                             ("price_fallback_blocks", int),
                                             ("price_publish_blocks", int),
                                             ])


class OracleConfigurationLoop(BgTaskExecutor):

    def __init__(self, eternal_storage_service: EternalStorageService):
        # Exchange price-fetch rate in seconds, all the exchanges are queried at the same time.
        self.ORACLE_PRICE_FETCH_RATE = parseTimeDelta(config('ORACLE_PRICE_FETCH_RATE', cast=str, default="5 secs"))
        # This loop collect a lot of information needed for validation (like last pub block) from the block chain
        self.ORACLE_BLOCKCHAIN_INFO_INTERVAL = parseTimeDelta(
            config('ORACLE_BLOCKCHAIN_INFO_INTERVAL', cast=str, default="3 secs"))
        # Per coin pair loop scanning interval, in which we try to publish
        self.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL = parseTimeDelta(
            config('ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL', cast=str, default="5 secs"))
        # Main Oracle loop scanning interval, in which we get the coinpair list
        self.ORACLE_MAIN_LOOP_TASK_INTERVAL = parseTimeDelta(
            config('ORACLE_MAIN_LOOP_TASK_INTERVAL', cast=str, default="120 secs"))
        # Configuratio Oracle loop scanning interval, in which we get configuration info
        self.ORACLE_CONFIGURATION_TASK_INTERVAL = parseTimeDelta(
            config('ORACLE_CONFIGURATION_TASK_INTERVAL', cast=str, default="240 secs"))

        # If the price delta percentage is grater than this we reject by not signing
        self.ORACLE_PRICE_REJECT_DELTA_PCT = config('ORACLE_PRICE_REJECT_DELTA_PCT', cast=float, default=50)
        # If the price delta percentage has changed and more than ORACLE_PRICE_FALLBACK_BLOCKS pass we act as fallbacks.
        self.ORACLE_PRICE_FALLBACK_DELTA_PCT = config('ORACLE_PRICE_FALLBACK_DELTA_PCT', cast=float, default=0.05)
        # Selected oracle publishes after  ORACLE_PRICE_PUBLISH_BLOCKS  blocks of a price change.
        self.ORACLE_PRICE_PUBLISH_BLOCKS = config('ORACLE_PRICE_PUBLISH_BLOCKS', cast=int, default=1)
        # Fallback oracle try to publish ORACLE_PRICE_FALLBACK_BLOCKS  blocks after price change.
        self.ORACLE_PRICE_FALLBACK_BLOCKS = config('ORACLE_PRICE_FALLBACK_BLOCKS', cast=int, default=3)
        # Timeout used when requesting signatures fom other oracles
        self.ORACLE_GATHER_SIGNATURE_TIMEOUT = parseTimeDelta(
            config('ORACLE_GATHER_SIGNATURE_TIMEOUT', cast=str, default="2 secs"))
        # Number of digit in which gathered prices are stored (wei)
        self.ORACLE_PRICE_DIGITS = 18
        # This is used to limit the difference in participation between selected oracles, the maximum stake used
        # is the minimum multiplied by this factor (even if some oracle has more stake participating)
        self.ORACLE_STAKE_LIMIT_MULTIPLICATOR = config('ORACLE_STAKE_LIMIT_MULTIPLICATOR', cast=int, default=2)

        # Size of the queue used to save historical exchange prices
        self.ORACLE_QUEUE_LEN = 30

        # Delay in which the scheduler checks for round change conditions
        self.SCHEDULER_POOL_DELAY = parseTimeDelta(config('SCHEDULER_POOL_DELAY', cast=str, default="10 secs"))

        # Delay in which the scheduler checks for round change after a round was closed
        self.SCHEDULER_ROUND_DELAY = parseTimeDelta(config('SCHEDULER_ROUND_DELAY', cast=str, default="1 days"))

        self.MESSAGE_VERSION = 3

        self._eternal_storage_service = eternal_storage_service
        super().__init__(self.run)

    async def run(self):
        logger.info("Configuration loop start")
        # self.eternal_storage_service.get_address()
        logger.info("Configuration loop done")
        return self.ORACLE_CONFIGURATION_TASK_INTERVAL

    @property
    def conf(self):
        return OracleConfiguration()

    @property
    def oracle_turn_conf(self):
        return OracleTurnConfiguration(self.ORACLE_STAKE_LIMIT_MULTIPLICATOR,
                                       self.ORACLE_PRICE_FALLBACK_DELTA_PCT,
                                       self.ORACLE_PRICE_FALLBACK_BLOCKS,
                                       self.ORACLE_PRICE_PUBLISH_BLOCKS)
