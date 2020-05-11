import asyncio
import collections
import logging
import time

from common.bg_task_executor import BgTaskExecutor
from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src import oracle_settings, monitor
from oracle.src.price_feeder import moc_price_engines

logger = logging.getLogger(__name__)


class TimeWithTimestampQueue:

    def __init__(self, name):
        self.name = name
        self._price_queue = collections.deque(maxlen=oracle_settings.ORACLE_QUEUE_LEN)

    def get_nearest_data(self, target_time_utc):
        ret = min(self._price_queue, key=lambda x: abs(target_time_utc - x["ts_utc"]))
        return ret["data"]

    def append(self, ts_utc, data):
        self._price_queue.append({"ts_utc": ts_utc, "data": data})


class PriceFeederLoop(BgTaskExecutor):

    def __init__(self, coin_pair: CoinPair):
        super().__init__(self.run)
        self._price_queues = {}
        self._coin_pair = str(coin_pair)
        engines = oracle_settings.ORACLE_PRICE_ENGINES[self._coin_pair]
        self._moc_price_engines = moc_price_engines.PriceEngines(self._coin_pair, engines)

    @property
    def coin_pair(self):
        return self._coin_pair

    async def get_last_price(self, target_time_utc=time.time()) -> PriceWithTimestamp:
        w_data = []
        for k in self._price_queues.keys():
            q = self._price_queues[k]
            data = q.get_nearest_data(target_time_utc)
            w_data.append(data)

        if len(w_data) == 0:
            return None

        idx = self._moc_price_engines.get_weighted_idx(w_data)
        val = w_data[idx]
        tm_utc = val['timestamp'].timestamp()
        price = val['price']

        l_times = [p_price['timestamp'].timestamp() for p_price in w_data]
        l_names = [p_price['name'] for p_price in w_data]
        l_prices = [p_price['price'] for p_price in w_data]
        info = [(x[1], str(x[0]), x[2]) for x in sorted(zip(l_prices, l_names, l_times))]
        logger.info("%s median: %r %r %r, %r" % (self._coin_pair, val['name'], str(price), tm_utc, info))

        last_price_fetch_wei = int(price * (10 ** oracle_settings.ORACLE_PRICE_DIGITS))
        logger.info("%s got price: %s, timestamp %r" % (self._coin_pair, last_price_fetch_wei, tm_utc))
        return PriceWithTimestamp(last_price_fetch_wei, tm_utc)

    async def run(self):
        try:
            w_data = await self._moc_price_engines.get_weighted()
            for val in w_data:
                name = val['name']
                tm_utc = val['timestamp'].timestamp()
                if name not in self._price_queues:
                    self._price_queues[name] = TimeWithTimestampQueue(name)
                logger.debug("%s insert: %s -> %s, timestamp %r" % (self._coin_pair, name, val['price'], tm_utc))
                self._price_queues[name].append(tm_utc, val)
            return oracle_settings.ORACLE_PRICE_FETCH_RATE
        except asyncio.CancelledError as e:
            raise e
        except Exception as ex:
            monitor.exchange_log("ERROR FETCHING PRICE %r" % ex)
            logger.error("ERROR FETCHING PRICE %r" % ex)
        return oracle_settings.ORACLE_PRICE_FETCH_RATE
