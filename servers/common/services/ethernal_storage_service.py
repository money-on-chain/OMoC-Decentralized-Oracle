import logging
from decimal import Decimal

from common import helpers, settings
from common.services import blockchain
from common.services.blockchain import is_error

logger = logging.getLogger(__name__)


class EternalStorageService:
    ETERNAL_STORAGE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "EternalStorageGobernanza.json")
    ETERNAL_STORAGE_ABI = ETERNAL_STORAGE_DATA["abi"]
    ETERNAL_STORAGE_ADDR = blockchain.parse_addr(ETERNAL_STORAGE_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self, addr=ETERNAL_STORAGE_ADDR, abi=ETERNAL_STORAGE_ABI):
        self._eternal_storage_contract = blockchain.get_contract(addr, abi)

    async def registry_call(self, method, text: str):
        h = blockchain.keccak256(text=text)
        return await blockchain.bc_call(self._eternal_storage_contract, method, h)

    async def get_uint(self, text: str):
        return await self.registry_call("getUint", text)

    async def get_string(self, text: str):
        return await self.registry_call("getString", text)

    async def get_address(self, text: str):
        return await self.registry_call("getAddress", text)

    async def get_bytes(self, text: str):
        return await self.registry_call("getBytes", text)

    async def get_bool(self, text: str):
        return await self.registry_call("getBool", text)

    async def get_int(self, text: str):
        return await self.registry_call("getInt", text)

    async def get_decimal(self, text: str):
        ret = await self.registry_call("getDecimal", text)
        if is_error(ret):
            return ret
        return Decimal(ret[0]) * (10 ** Decimal(ret[1]))
