import asyncio
import collections
import logging
import time
from statistics import median

from common.bg_task_executor import BgTaskExecutor
from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src import oracle_settings
from oracle.src.price_feeder import moc_price_engines

logger = logging.getLogger(__name__)


class PriceFeederLoop(BgTaskExecutor):

    def __init__(self, coin_pair: CoinPair):
        super().__init__(self.fetch_price_loop)
        self._price_queue = collections.deque(maxlen=oracle_settings.ORACLE_QUEUE_LEN)
        self._coin_pair = str(coin_pair)
        engines = oracle_settings.ORACLE_PRICE_ENGINES[self._coin_pair]
        self._moc_price_engines = moc_price_engines.PriceEngines(self._coin_pair, engines)

    @property
    def coin_pair(self):
        return self._coin_pair

    async def get_last_price(self, target_time_utc=time.time()) -> PriceWithTimestamp:
        if not self._price_queue:
            return None
        ret = min(self._price_queue, key=lambda x: abs(target_time_utc - x.ts_utc))
        logger.info("%s: Got price %r" % (self._coin_pair, ret))
        return ret

    async def fetch_price_loop(self):
        try:
            w_prices = await self._moc_price_engines.get_weighted()
            # timestamps in utc
            tms = [w['timestamp'].timetuple() for w in w_prices]
            tm_utc = median([time.mktime(t) for t in tms])
            w_median = self._moc_price_engines.get_weighted_median(w_prices)
            last_price_fetch_wei = int(w_median * (10 ** oracle_settings.ORACLE_PRICE_DIGITS))
            self._price_queue.append(PriceWithTimestamp(last_price_fetch_wei, tm_utc))
            return oracle_settings.ORACLE_PRICE_FETCH_RATE
        except asyncio.CancelledError as e:
            raise e
        except Exception as ex:
            logging.getLogger("exchange_price").info("ERROR FETCHING PRICE %r" % ex)
            logger.error("ERROR FETCHING PRICE %r" % ex)
        return oracle_settings.ORACLE_PRICE_FETCH_RATE
