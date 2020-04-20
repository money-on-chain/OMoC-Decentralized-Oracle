import inspect
import json
import logging
import os
from datetime import datetime

import aiohttp
from web3 import Web3


logger = logging.getLogger(__name__)



def parse_addr(addr):
    return Web3.toChecksumAddress(addr)


def parseTimeDelta(data):
    _base = datetime(2020, 1, 1)
    delta = _base - dateparser.parse(data, settings={'RELATIVE_BASE': _base})
    return round(delta.total_seconds())


def readfile(*args):
    filename = os.path.join(*args)
    try:
        with open(filename) as f:
            return json.loads(f.read())
    except:
        print("Error opening: %s.."%filename)
        raise

async def request_get(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            # print("Status:", response.status)
            # print("Content-type:", response.headers['content-type'])
            return await response.text()
            # html = await response.text()
            # print("Body:", html[:15], "...")


async def request_post(url, payload={}, timeout=10):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=payload, timeout=timeout) as response:
            return await response.text()


def ErrorObj(msg_obj):
    return {"error": str(msg_obj)}


def enc_uint256(x):
    return "%064x" % x


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


def log_setup():
    xlogger = logging.getLogger("exchange_price")
    fh = logging.FileHandler("exchange_price.log")
    fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    xlogger.addHandler(fh)


class PrintableClass:
    @property
    def initargs(self):
        return inspect.getfullargspec(self.__init__).args[1:]

    def __repr__(self):
        return "<%s>" % " ".join("%s:%s" % (k, getattr(self, k)) for k in self.initargs)

    def __str__(self):
        return self.__repr__()
