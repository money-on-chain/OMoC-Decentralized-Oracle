import logging
import typing

from common.bg_task_executor import BgTaskExecutor
from common.services.blockchain import is_error
from common.services.coin_pair_price_service import CoinPairPriceService
from oracle.src import oracle_settings, oracle_service
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfoLoop, OracleBlockchainInfo
from oracle.src.oracle_coin_pair_loop import OracleCoinPairLoop
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_turn import OracleTurn
from oracle.src.price_feeder.price_feeder import PriceFeederLoop
from oracle.src.request_validation import RequestValidation

logger = logging.getLogger(__name__)

OracleLoopTasks = typing.NamedTuple("OracleLoopTasks",
                                    [("coin_pair_service", CoinPairPriceService),
                                     ("tasks", typing.List[BgTaskExecutor]),
                                     ("coin_pair_loop", OracleCoinPairLoop),
                                     ("price_feeder_loop", PriceFeederLoop),
                                     ("blockchain_info_loop", OracleBlockchainInfoLoop),
                                     ("oracle_turn", OracleTurn)
                                     ])


class OracleLoop(BgTaskExecutor):

    def __init__(self):
        self.cpMap = {}
        super().__init__(self.run)

    def stop_bg_task(self):
        for cp_key in self.cpMap:
            self.delete_child(cp_key)
        super().stop_bg_task()

    def delete_child(self, cp_key):
        old = self.cpMap.pop(cp_key)
        for x in old.tasks:
            x.stop_bg_task()

    def add_child(self, cp_service):
        pf_loop = PriceFeederLoop(cp_service.coin_pair)
        bl_loop = OracleBlockchainInfoLoop(cp_service)
        cp_loop = OracleCoinPairLoop(cp_service, pf_loop, bl_loop)
        tasks = [pf_loop, bl_loop, cp_loop]
        for x in tasks:
            x.start_bg_task()
        self.cpMap[str(cp_service.coin_pair)] = OracleLoopTasks(cp_service, tasks,
                                                                cp_loop, pf_loop, bl_loop,
                                                                OracleTurn(cp_service.coin_pair))

    async def run(self):
        logger.info("Oracle loop start")
        coin_pair_services = await oracle_service.get_all_coin_pair_service()
        if is_error(coin_pair_services):
            logger.error("Error getting coinpairs %r" % (coin_pair_services,))
            return oracle_settings.ORACLE_MAIN_LOOP_TASK_INTERVAL

        coin_pair_keys = [str(x.coin_pair) for x in coin_pair_services]
        logger.info("Got coinpair list %r" % (coin_pair_keys,))
        deleted_coin_pairs = [x for x in self.cpMap if x not in coin_pair_keys]
        for cp_key in deleted_coin_pairs:
            logger.info("Deleted coinpair %r stop it" % cp_key)
            self.delete_child(cp_key)

        added_services = [x for x in coin_pair_services if str(x.coin_pair) not in self.cpMap]
        for cp_service in added_services:
            cp_key = str(cp_service.coin_pair)
            logger.info("Adding New coinpair %r" % cp_key)
            self.add_child(cp_service)

        logger.info("Oracle loop done")
        return oracle_settings.ORACLE_MAIN_LOOP_TASK_INTERVAL

    async def get_validation_data(self, params: PublishPriceParams) -> RequestValidation:
        tasks: OracleLoopTasks = self.cpMap.get(str(params.coin_pair))
        if not tasks or not tasks.price_feeder_loop \
                or not tasks.blockchain_info_loop or not tasks.oracle_turn:
            return None

        exchange_price = await tasks.price_feeder_loop.get_last_price(params.price_ts_utc)
        blockchain_info: OracleBlockchainInfo = tasks.blockchain_info_loop.get()
        return RequestValidation(params, tasks.oracle_turn, exchange_price, blockchain_info)
