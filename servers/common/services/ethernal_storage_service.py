import logging

from eth_typing import HexStr, Primitives

from common import helpers, settings
from common.services import blockchain

logger = logging.getLogger(__name__)


class EternalStorageService:
    ETERNAL_STORAGE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "EternalStorageGobernanza.json")
    ETERNAL_STORAGE_ABI = ETERNAL_STORAGE_DATA["abi"]
    ETERNAL_STORAGE_ADDR = blockchain.parse_addr(ETERNAL_STORAGE_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self, addr=ETERNAL_STORAGE_ADDR, abi=ETERNAL_STORAGE_ABI):
        self._eternal_storage_contract = blockchain.get_contract(addr, abi)

    async def registry_call(self, method, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await blockchain.bc_call(self._eternal_storage_contract, method,
                                        blockchain.keccak256(text=text, hexstr=hexstr, primitive=primitive))

    async def get_uint(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getUint", text=text, hexstr=hexstr, primitive=primitive)

    async def get_string(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getString", text=text, hexstr=hexstr, primitive=primitive)

    async def get_address(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getAddress", text=text, hexstr=hexstr, primitive=primitive)

    async def get_bytes(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getBytes", text=text, hexstr=hexstr, primitive=primitive)

    async def get_bool(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getBool", text=text, hexstr=hexstr, primitive=primitive)

    async def get_int(self, text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
        return await self.registry_call("getInt", text=text, hexstr=hexstr, primitive=primitive)
