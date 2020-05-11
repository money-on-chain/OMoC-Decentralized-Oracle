import logging

from eth_typing import HexStr

from common import settings, helpers
from common.services import blockchain

logger = logging.getLogger(__name__)

ETERNAL_STORAGE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "EternalStorageGobernanza.json")
ETERNAL_STORAGE_ABI = ETERNAL_STORAGE_DATA["abi"]
ETERNAL_STORAGE_ADDR = blockchain.parse_addr(ETERNAL_STORAGE_DATA["networks"][str(settings.NETWORK_ID)]["address"])
_eternal_storage_contract = blockchain.get_contract(ETERNAL_STORAGE_ADDR, ETERNAL_STORAGE_ABI)


async def registry_call(method, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await blockchain.bc_call(_eternal_storage_contract, method,
                                    blockchain.keccak256(text=text, hexstr=hexstr, primitive=primitive))


async def get_uint(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getUint", text=text, hexstr=hexstr, primitive=primitive)


async def get_string(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getString", text=text, hexstr=hexstr, primitive=primitive)


async def get_address(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getAddress", text=text, hexstr=hexstr, primitive=primitive)


async def get_bytes(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getBytes", text=text, hexstr=hexstr, primitive=primitive)


async def get_bool(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getBool", text=text, hexstr=hexstr, primitive=primitive)


async def get_int(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return await registry_call("getInt", text=text, hexstr=hexstr, primitive=primitive)
