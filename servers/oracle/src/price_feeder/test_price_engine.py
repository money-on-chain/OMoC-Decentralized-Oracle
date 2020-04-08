import datetime
from decimal import Decimal

import pytest

from oracle.src.price_feeder.moc_price_engines import PriceEngineBase, PriceEngines, base_engines_names, LogMeta


@pytest.mark.exchanges
@pytest.mark.asyncio
async def test_fetch_from_all_exchanges():
    log = LogMeta();
    for name in base_engines_names.keys():
        engine = base_engines_names[name](log)
        json, err_msg = await engine.fetch()

        print("------------------->", name, json, type(engine.map(json)["price"]))


@pytest.mark.asyncio
async def test_engines1():
    class PriceEngineTest1(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7250.10')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest2(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7258.32')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest3(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7283.81')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest4(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7286.25')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    pr_engine = PriceEngines("BTCUSD", [
        {"name": "test_1", "ponderation": Decimal('0.1605'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_2", "ponderation": Decimal('0.2138'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_3", "ponderation": Decimal('0.2782'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_4", "ponderation": Decimal('0.3475'), "min_volume": 0.0, "max_delay": 0}
    ], engines_names={
        "test_1": PriceEngineTest1,
        "test_2": PriceEngineTest2,
        "test_3": PriceEngineTest3,
        "test_4": PriceEngineTest4
    })
    w_prices = await pr_engine.get_weighted()
    w_median = pr_engine.get_weighted_median(w_prices)
    # Taken from running price-feeder/price_test.py
    assert w_median == Decimal('7283.81')


@pytest.mark.asyncio
async def test_engines2():
    class PriceEngineTest5(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7250.10')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest6(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7283.81')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest7(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7286.25')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest8(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7984.15')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    pr_engine = PriceEngines("BTCUSD", [
        {"name": "test_5", "ponderation": Decimal('0.1605'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_6", "ponderation": Decimal('0.2782'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_7", "ponderation": Decimal('0.3475'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_8", "ponderation": Decimal('0.2138'), "min_volume": 0.0, "max_delay": 0}
    ], engines_names={
        "test_5": PriceEngineTest5,
        "test_6": PriceEngineTest6,
        "test_7": PriceEngineTest7,
        "test_8": PriceEngineTest8
    })
    w_prices = await pr_engine.get_weighted()
    w_median = pr_engine.get_weighted_median(w_prices)
    # Taken from running price-feeder/price_test.py
    assert w_median == Decimal('7286.25')


@pytest.mark.asyncio
async def test_engines3():
    class PriceEngineTest9(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7250.1')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest10(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7283.81')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest11(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7286.25')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest12(PriceEngineBase):
        async def get_price(self):
            return None, "Error"

    pr_engine = PriceEngines("BTCUSD", [
        {"name": "test_9", "ponderation": Decimal('0.1605'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_10", "ponderation": Decimal('0.2782'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_11", "ponderation": Decimal('0.3475'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_12", "ponderation": Decimal('0.2138'), "min_volume": 0.0, "max_delay": 0}
    ], engines_names={
        "test_9": PriceEngineTest9,
        "test_10": PriceEngineTest10,
        "test_11": PriceEngineTest11,
        "test_12": PriceEngineTest12
    })
    w_prices = await  pr_engine.get_weighted()
    w_median = pr_engine.get_weighted_median(w_prices)
    # Taken from running price-feeder/price_test.py
    assert w_median == Decimal('7283.81')


@pytest.mark.asyncio
async def test_engines4():
    class PriceEngineTest13(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('8000')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest14(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7000')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest15(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7000')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest16(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal('7000')
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    pr_engine = PriceEngines("BTCUSD", [
        {"name": "test_13", "ponderation": Decimal('0.2782'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_14", "ponderation": Decimal('0.2138'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_15", "ponderation": Decimal('0.3475'), "min_volume": 0.0, "max_delay": 0},
        {"name": "test_16", "ponderation": Decimal('0.1605'), "min_volume": 0.0, "max_delay": 0}
    ], engines_names={
        "test_13": PriceEngineTest13,
        "test_14": PriceEngineTest14,
        "test_15": PriceEngineTest15,
        "test_16": PriceEngineTest16
    })
    w_prices = await pr_engine.get_weighted()
    w_median = pr_engine.get_weighted_median(w_prices)
    # Taken from running price-feeder/price_test.py
    assert w_median == Decimal('7000')


@pytest.mark.asyncio
async def test_float_fail():
    class PriceEngineTest17(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal(0.1 + 0.2)
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest18(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal(0.1 + 0.2)
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest19(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal(0.1 + 0.2)
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    class PriceEngineTest20(PriceEngineBase):
        async def get_price(self):
            d_price_info = dict()
            d_price_info['price'] = Decimal(0.1 + 0.2)
            d_price_info['volume'] = 0.0
            d_price_info['timestamp'] = datetime.datetime.now()

            return d_price_info, None

    pr_engine = PriceEngines("BTCUSD", [
        {"name": "test_17", "ponderation": 0.2782, "min_volume": 0.0, "max_delay": 0},
        {"name": "test_18", "ponderation": 0.2138, "min_volume": 0.0, "max_delay": 0},
        {"name": "test_19", "ponderation": 0.3475, "min_volume": 0.0, "max_delay": 0},
        {"name": "test_20", "ponderation": 0.1605, "min_volume": 0.0, "max_delay": 0}
    ], engines_names={
        "test_17": PriceEngineTest17,
        "test_18": PriceEngineTest18,
        "test_19": PriceEngineTest19,
        "test_20": PriceEngineTest20
    })
    w_prices = await pr_engine.get_weighted()
    w_median = pr_engine.get_weighted_median(w_prices)
    # Taken from running price-feeder/price_test.py
    assert w_median == 0.30000000000000004
