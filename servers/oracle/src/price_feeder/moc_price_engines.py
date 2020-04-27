import asyncio
import contextlib
import datetime
import decimal
import json
import logging
from decimal import Decimal

import aiohttp
import requests

from oracle.src import monitor

logger = logging.getLogger(__name__)

decimal.getcontext().prec = 28


def get_utc_time(timestamp_str):
    return datetime.datetime.fromtimestamp(int(timestamp_str), datetime.timezone.utc)


def weighted_median(values, weights):
    idx = weighted_median_idx(values, weights)
    return values[idx]


def weighted_median_idx(values, weights):
    ''' compute the weighted median of values list. The weighted median is computed as follows:
    1- sort both lists (values and weights) based on values.
    2- select the 0.5 point from the weights and return the corresponding values as results
    e.g. values = [1, 3, 0] and weights=[0.1, 0.3, 0.6] assuming weights are probabilities.
    sorted values = [0, 1, 3] and corresponding sorted weights = [0.6,     0.1, 0.3] the 0.5 point on
    weight corresponds to the first item which is 0. so the weighted     median is 0.'''

    # convert the weights into probabilities
    sum_weights = sum(weights)
    weights = [w / sum_weights for w in weights]
    # sort values and weights based on values
    sorted_tuples = sorted(zip(values, weights, range(len(values))))

    # select the median point
    cumulative_probability = 0
    for i in range(len(sorted_tuples)):
        cumulative_probability += sorted_tuples[i][1]
        if cumulative_probability > 0.5:
            return sorted_tuples[i][2]
        elif cumulative_probability == 0.5:
            if i + 1 >= len(sorted_tuples):
                return sorted_tuples[i][2]
            return (sorted_tuples[i][2] + sorted_tuples[i + 1][2]) / 2
    return sorted_tuples[-1][2]


@contextlib.contextmanager
def closing(thing):
    try:
        yield thing
    finally:
        asyncio.create_task(thing.close())


# TODO: USE THIS ONE.
async def fetch_price_with_accxt():
    global _last_price_fetch, _last_delta, _last_price_fetch_wei

    with closing(accxt.kraken({
        'apiKey': "hEvQNMDIeoCJbr7W/ZBb5CGOrx3G0lWF5B3zqa1JBxdZlEaL8EK+D0Mw",
        'secret': "JaE9wI6Nwgh5oRxiHcVxurwzwBxwc05W/qv/k1srGg4s3EYuXPpNkLLM5NYbbWpM8rCyijIeDavRuqWbU0ZV9A=="})
    ) as kraken:
        tick = await kraken.fetch_ticker('BTC/USD')
    price = (tick["ask"] + tick["bid"]) / 2
    avg = abs((_last_price_fetch + price) / 2)
    _last_delta = 0 if avg == 0 else abs(100.0 * ((_last_price_fetch - price) / avg))
    logger.info(
        "New Price Fetch: " + str(price) + " Old: " + str(_last_price_fetch) + " Delta pct: " + str(_last_delta))
    _last_price_fetch = price
    p = Decimal(price)
    exp = Decimal("1" + ("0" * oracle_settings.ORACLE_PRICE_DIGITS))
    _last_price_fetch_wei = int(p * exp)
    return max(oracle_settings.ORACLE_PRICE_FETCH_RATE, kraken.rateLimit / 1000)


class PriceEngineBase(object):
    name = "base_engine"
    description = "Base Engine"
    uri = "http://api.pricefetcher.com/BTCUSD"
    convert = "BTC_USD"

    def __init__(self, log, timeout=10, uri=None):
        self.log = log
        self.timeout = timeout
        if uri:
            self.uri = uri

    def send_alarm(self, message, level=0):
        self.log.error(message)

    async def fetch(self):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.uri, timeout=self.timeout) as response:
                    # print("Status:", response.status)
                    # print("Content-type:", response.headers['content-type'])
                    response.raise_for_status()
                    if not response:
                        err_msg = "Error! No response from server on get price. Engine: {0}".format(self.name)
                        self.send_alarm(err_msg)
                        return None, err_msg

                    if response.status != 200:
                        err_msg = "Error! Error response from server on get price. Engine: {0}".format(self.name)
                        self.send_alarm(err_msg)
                        return None, err_msg
                    jsonTxt = await response.json(loads=lambda x: json.loads(x, parse_float=Decimal))
                    return jsonTxt, ""
        except asyncio.CancelledError as e:
            raise e
        except requests.exceptions.HTTPError as http_err:
            err_msg = "Error! Error response from server on get price. Engine: {0}. {1}".format(self.name, http_err)
            self.send_alarm(err_msg)
            return None, err_msg
        except Exception as err:
            err_msg = "Error. Error response from server on get price. Engine: {0}. {1}".format(self.name, err)
            self.send_alarm(err_msg)
            return None, err_msg

    @staticmethod
    def map(response_json):
        raise NotImplementedError()

    async def get_price(self):

        response_json, err_msg = await self.fetch()
        if not response_json:
            return None, err_msg
        try:
            d_price_info = self.map(response_json)
        except asyncio.CancelledError as e:
            raise e
        except Exception as err:
            err_msg = "Error. Error response from server on get price. Engine: {0}. {1}".format(self.name, err)
            self.send_alarm(err_msg)
            return None, err_msg
        return d_price_info, None


class BitstampBTCUSD(PriceEngineBase):
    name = "bitstamp_btc_usd"
    description = "Bitstamp"
    uri = "https://www.bitstamp.net/api/v2/ticker/btcusd/"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['last'])
        d_price_info['volume'] = Decimal(response_json['volume'])
        d_price_info['timestamp'] = get_utc_time(response_json['timestamp'])
        return d_price_info


class CoinBaseBTCUSD(PriceEngineBase):
    name = "coinbase_btc_usd"
    description = "Coinbase"
    # uri = "https://api.coinbase.com/v2/prices/BTC-USD/buy"
    uri = "https://api.coinbase.com/v2/prices/spot?currency=USD"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['data']['amount'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class BitGOBTCUSD(PriceEngineBase):
    name = "bitgo_btc_usd"
    description = "BitGO"
    uri = "https://www.bitgo.com/api/v1/market/latest"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['latest']['currencies']['USD']['last'])
        d_price_info['volume'] = Decimal(response_json['latest']['currencies']['USD']['total_vol'])
        d_price_info['timestamp'] = get_utc_time(response_json['latest']['currencies']['USD']['timestamp'])
        return d_price_info


class BitfinexBTCUSD(PriceEngineBase):
    name = "bitfinex_btc_usd"
    description = "Bitfinex"
    uri = "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json[6])
        d_price_info['volume'] = Decimal(response_json[7])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class BlockchainBTCUSD(PriceEngineBase):
    name = "blockchain_btc_usd"
    description = "Blockchain"
    uri = "https://blockchain.info/ticker"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['USD']['last'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class BinanceBTCUSD(PriceEngineBase):
    name = "binance_btc_usd"
    description = "Binance"
    uri = "https://api.binance.com/api/v1/ticker/24hr?symbol=BTCUSDT"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['lastPrice'])
        d_price_info['volume'] = Decimal(response_json['volume'])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class KucoinBTCUSD(PriceEngineBase):
    name = "kucoin_btc_usd"
    description = "Binance"
    uri = "https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['data']['last'])
        d_price_info['volume'] = Decimal(response_json['data']['vol'])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class KrakenBTCUSD(PriceEngineBase):
    name = "kraken_btc_usd"
    description = "Kraken"
    uri = "https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['result']['XXBTZUSD']['c'][0])
        d_price_info['volume'] = Decimal(response_json['result']['XXBTZUSD']['v'][1])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class BittrexBTCUSD(PriceEngineBase):
    name = "bittrex_btc_usd"
    description = "Bittrex"
    uri = "https://api.bittrex.com/api/v1.1/public/getticker?market=USD-BTC"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['result']['Last'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class GeminiBTCUSD(PriceEngineBase):
    name = "gemini_btc_usd"
    description = "Gemini"
    uri = "https://api.gemini.com/v1/pubticker/BTCUSD"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['last'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class OkCoinBTCUSD(PriceEngineBase):
    name = "okcoin_btc_usd"
    description = "OkCoin"
    uri = "https://www.okcoin.com/api/spot/v3/instruments/BTC-USD/ticker"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['last'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class ItBitBTCUSD(PriceEngineBase):
    name = "itbit_btc_usd"
    description = "ItBit"
    uri = "https://api.itbit.com/v1/markets/XBTUSD/ticker"
    convert = "BTC_USD"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['lastPrice'])
        d_price_info['volume'] = 0.0
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


# RIF BTC


class BitfinexRIFBTC(PriceEngineBase):
    name = "bitfinex_rif_btc"
    description = "Bitfinex RIF"
    uri = "https://api-pub.bitfinex.com/v2/ticker/tRIFBTC"
    convert = "RIF_BTC"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json[6])
        d_price_info['volume'] = Decimal(response_json[7])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


class BithumbproRIFBTC(PriceEngineBase):
    name = "bithumbpro_rif_btc"
    description = "BitHumb RIF"
    uri = "https://global-openapi.bithumb.pro/openapi/v1/spot/ticker?symbol=RIF-BTC"
    convert = "RIF_BTC"

    @staticmethod
    def map(response_json):
        d_price_info = dict()
        d_price_info['price'] = Decimal(response_json['data'][0]['c'])
        d_price_info['volume'] = Decimal(response_json['data'][0]['v'])
        d_price_info['timestamp'] = datetime.datetime.now(datetime.timezone.utc)
        return d_price_info


base_engines_names = {
    "coinbase": CoinBaseBTCUSD,
    "bitstamp": BitstampBTCUSD,
    "bitgo": BitGOBTCUSD,
    "bitfinex": BitfinexBTCUSD,
    "blockchain": BlockchainBTCUSD,
    "bittrex": BittrexBTCUSD,
    "kraken": KrakenBTCUSD,
    "kucoin": KucoinBTCUSD,
    "binance": BinanceBTCUSD,
    "gemini": GeminiBTCUSD,
    "okcoin": OkCoinBTCUSD,
    "itbit": ItBitBTCUSD,
    "bitfinex_rif": BitfinexRIFBTC,
    "bithumbpro_rif": BithumbproRIFBTC
}


class LogMeta(object):

    @staticmethod
    def info(msg):
        logger.info("INFO: {0}".format(msg))

    @staticmethod
    def error(msg):
        logger.error("ERROR: {0}".format(msg))


class PriceEngines(object):
    def __init__(self, coin_pair, price_options, log=None, engines_names=None):
        self._coin_pair = coin_pair
        self.price_options = price_options
        self.log = log
        if not self.log:
            self.log = LogMeta()
        self.engines_names = engines_names
        if not engines_names:
            self.engines_names = base_engines_names
        self.engines = list()
        self.add_engines()

    def add_engines(self):
        for price_engine in self.price_options:
            engine_name = price_engine["name"]

            if engine_name not in self.engines_names:
                raise Exception("The engine price name not in the available list")

            engine = self.engines_names.get(engine_name)
            i_engine = engine(self.log)

            d_engine = dict()
            d_engine["engine"] = i_engine
            d_engine["ponderation"] = price_engine["ponderation"]
            d_engine["min_volume"] = price_engine["min_volume"]
            d_engine["max_delay"] = price_engine["max_delay"]
            d_engine["name"] = engine_name
            self.engines.append(d_engine)

    async def fetch_prices(self):
        async def azip(engine):
            return (engine, await engine["engine"].get_price(),)

        cor = [azip(engine) for engine in self.engines]
        p_data = await asyncio.gather(*cor, return_exceptions=True)
        prices = []
        for (engine, (d_price, err_msg)) in p_data:
            if d_price:
                i_price = dict()
                i_price['name'] = engine["name"]
                i_price['ponderation'] = engine["ponderation"]
                i_price['price'] = d_price["price"]
                i_price['volume'] = d_price["volume"]
                i_price['timestamp'] = d_price["timestamp"]
                i_price['min_volume'] = engine["min_volume"]
                i_price['max_delay'] = engine["max_delay"]

                if i_price["min_volume"] > 0:
                    # the evalution of volume is on
                    if not i_price['volume'] > i_price["min_volume"]:
                        # is not added to the price list
                        self.log.warning("Not added to the list because is not at to the desire volume: %s" %
                                         i_price['name'])
                        continue

                prices.append(i_price)

        return prices

    def get_weighted_idx(self, f_prices):
        l_prices = [p_price['price'] for p_price in f_prices]
        l_weights = [Decimal(p_price['ponderation']) for p_price in f_prices]
        idx = weighted_median_idx(l_prices, l_weights)
        monitor.exchange_log("%s median: %s" % (self._coin_pair, l_prices[idx]))
        return idx

    def get_weighted_median(self, f_prices):
        idx = self.get_weighted_idx(f_prices)
        return f_prices[idx]['price']

    async def get_weighted(self):
        f_prices = await self.fetch_prices()
        monitor.report_prices(self.engines, f_prices)
        return f_prices
