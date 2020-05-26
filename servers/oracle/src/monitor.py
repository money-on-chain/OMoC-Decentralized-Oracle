import logging

from common.bg_task_executor import BgTaskExecutor
from common.services.blockchain import BlockChain, is_error
from oracle.src import oracle_settings
from oracle.src.oracle_coin_pair_service import OracleCoinPairService
from oracle.src.oracle_configuration import OracleConfiguration
from oracle.src.oracle_service import OracleService
from oracle.src.select_next import select_next


class MonitorLoopByCoinPair:

    def __init__(self, conf: OracleConfiguration, logger, cps: OracleCoinPairService):
        self._conf = conf
        self._logger = logger
        self._cps = cps
        self._pre_pubblock_nr = None

    async def run(self):
        # published-block
        pubblock_nr = await self._cps.get_last_pub_block()
        if self._pre_pubblock_nr == pubblock_nr:
            return 5
        self._pre_pubblock_nr = pubblock_nr

        price = await self._cps.get_price()
        pubblock_hash = await self._cps.get_last_pub_block_hash(pubblock_nr)
        oracles = await self._cps.get_selected_oracles_info()
        if is_error(oracles):
            self._logger.error("Error getting oracles %r" % (oracles,))
            return 5
        self._logger.info("block %r published price: %r " % (pubblock_nr, price))
        sorted_oracles = select_next(self._conf.ORACLE_STAKE_LIMIT_MULTIPLICATOR, _pubblock_hash, oracles)
        for idx, oracle_addr in enumerate(sorted_oracles):
            self._logger.debug(" turn: %d  oracle: %s " % (idx, oracle_addr))
        self._logger.debug("---------")
        return 5


class MonitorTask(BgTaskExecutor):

    def __init__(self, blockchain: BlockChain, oracle_service: OracleService):
        self.blockchain = blockchain
        self.oracle_service = oracle_service
        self.logger = logging.getLogger("published_price")
        self.prev_block = self.pre_pubblock_nr = None
        self.cpMap = {}
        super().__init__(name="MonitorTask", main=self.run)

    async def run(self):
        # blockchain-block
        block = await self.blockchain.get_last_block()
        if is_error(block):
            self.logger.error("Error getting last block %r" % (block,))
            return 5
        if self.prev_block == block:
            return 5
        self.prev_block = block
        pairs = await self.oracle_service.get_all_coin_pair_services()
        if is_error(pairs):
            self.logger.error("Can't retrieve coinpairs")
            return 5
        for cps in pairs:
            cp_key = str(cps.coin_pair)
            if not self.cpMap.get(cp_key):
                self.logger.info("%r : Adding New coinpair" % cps.coin_pair)
                self.cpMap[cp_key] = MonitorLoopByCoinPair(self.logger, cps)
            await self.cpMap[cp_key].run()
        return 5


def log_setup():
    if oracle_settings.ORACLE_MONITOR_RUN:
        xlogger = logging.getLogger("exchange_price")
        fn = oracle_settings.ORACLE_MONITOR_LOG_EXCHANGE_PRICE
        if not fn in ("",):
            fh = logging.FileHandler(fn)
        fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        xlogger.addHandler(fh)

        xlogger = logging.getLogger("published_price")
        fn = oracle_settings.ORACLE_MONITOR_LOG_PUBLISHED_PRICE
        if not fn in ("",):
            fh = logging.FileHandler(fn)
        fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        xlogger.addHandler(fh)


def exchange_log(msg):
    if oracle_settings.ORACLE_MONITOR_RUN:
        l = logging.getLogger("exchange_price")
        l.info(msg)


def publish_log(msg):
    if oracle_settings.ORACLE_MONITOR_RUN:
        pplogger = logging.getLogger("published_price")
        pplogger.warning(msg)


def report_prices(engines, f_prices):
    all_engines = {engine["name"] for engine in engines}
    list_all_engines = list(all_engines)
    list_all_engines.sort()
    fetched = {pr['name']: str(pr['price']) for pr in f_prices}
    for pending in all_engines - set(fetched.keys()):
        fetched[pending] = "--"
    exchange_log(",".join(list_all_engines))
    exchange_log(",".join([fetched[engine] for engine in list_all_engines]))
