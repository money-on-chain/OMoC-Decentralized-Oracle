import asyncio
import inspect
import json
import logging
import os
import traceback
from datetime import datetime

import aiohttp
import dateparser

logger = logging.getLogger(__name__)


def parseTimeDelta(data):
    _base = datetime(2020, 1, 1)
    delta = _base - dateparser.parse(data, settings={'RELATIVE_BASE': _base})
    return round(delta.total_seconds())


def readfile(contract_folder, filename):
    with open(os.path.join(contract_folder, filename)) as f:
        return json.loads(f.read())


async def request_get(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            # print("Status:", response.status)
            # print("Content-type:", response.headers['content-type'])
            return await response.text()
            # html = await response.text()
            # print("Body:", html[:15], "...")


async def request_post(url, payload={}, timeout=10, raise_for_status=False):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=payload, timeout=timeout, raise_for_status=raise_for_status) as response:
            return await response.text(), response.status


def ErrorObj(msg_obj):
    return {"error": str(msg_obj)}


def enc_uint256(x):
    return "%064x" % x


def enc_byte32(x):
    return x.ljust(32, b'\0').hex()


def enc_address(x):
    return enc_uint256(x)  ## por mas que sean 0x40


def enc_packed_address(x):
    return "%040x" % x


def addr_to_number(addr):
    if not addr:
        return 0
    if addr.startswith("0x"):
        addr = addr[2:]
    addr = int(addr, 16)
    return addr


def str_to_bytes(s):
    return bytes(s, "ascii")


def hb_to_bytes(h):
    return bytes.fromhex(h.hex()[2:])


class PrintableClass:
    @property
    def initargs(self):
        return inspect.getfullargspec(self.__init__).args[1:]

    def __repr__(self):
        return "<%s>" % " ".join("%s:%s" % (k, getattr(self, k)) for k in self.initargs)

    def __str__(self):
        return self.__repr__()


def run_main(main):
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except ValueError as err:
        if isinstance(err.args, list):
            err = err.args[0]["message"]
        else:
            traceback.print_exc()
        print("error: ", err)


def price_delta(price1, price2):
    return (abs(price1 - price2) / abs(min(price1, price2))) * 100
