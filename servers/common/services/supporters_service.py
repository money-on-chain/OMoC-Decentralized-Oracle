import logging
import typing

from common import helpers, settings
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount

logger = logging.getLogger(__name__)

SupportersDetailedBalance = typing.NamedTuple("SupportersDetailedBalance",
                                              [("staked", int),
                                               ("staked_in_block", int),
                                               ("stopped", int),
                                               ("stopped_in_block", int),
                                               ])


class SupportersService:
    SUPPORTERS_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "SupportersVested.json")
    SUPPORTERS_ABI = SUPPORTERS_DATA["abi"]
    SUPPORTERS_ADDR = blockchain.parse_addr(SUPPORTERS_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self, addr=SUPPORTERS_ADDR, abi=SUPPORTERS_ABI):
        self._supporters_contract = blockchain.get_contract(addr, abi)

    async def supporters_call(self, method, *args, **kw):
        return await blockchain.bc_call(self._supporters_contract, method, *args, **kw)

    async def supporters_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await blockchain.bc_execute(self._supporters_contract, method, *args, account=account, wait=wait, **kw)

    async def distribute(self, account: BlockchainAccount = None, wait=False):
        return await self.supporters_execute("distribute", account=account, wait=wait)

    async def add_stake(self, mocs: int, account: BlockchainAccount = None, wait=False):
        return await self.supporters_execute("addStake", mocs, account=account, wait=wait)

    async def stop(self, account: BlockchainAccount = None, wait=False):
        return await self.supporters_execute("stop", account=account, wait=wait)

    async def restart(self, account: BlockchainAccount = None, wait=False):
        return await self.supporters_execute("reStake", account=account, wait=wait)

    async def withdraw(self, account: BlockchainAccount = None, wait=False):
        return await self.supporters_execute("withdraw", account=account, wait=wait)

    async def balance_of(self, addr: BlockChainAddress):
        return await self.supporters_call("balanceOf", addr)

    async def detailed_balance_of(self, addr: BlockChainAddress) -> SupportersDetailedBalance:
        data = await self.supporters_call("detailedBalanceOf", addr)
        return SupportersDetailedBalance(*data)

    async def is_ready_to_distribute(self) -> bool:
        return await self.supporters_call("isReadyToDistribute")
