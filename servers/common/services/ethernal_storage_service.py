import logging
from decimal import Decimal

from common.services import blockchain
from common.services.blockchain import is_error, BlockChainContract

logger = logging.getLogger(__name__)


class EternalStorageService:

    def __init__(self, contract: BlockChainContract):
        self._contract = contract

    async def registry_call(self, method, text: str):
        h = blockchain.keccak256(text=text)
        return await self._contract.bc_call(method, h)

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
