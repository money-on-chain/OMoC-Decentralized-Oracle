import logging
import typing

from common.services.blockchain import BlockChainAddress, BlockchainAccount, BlockChainContract

logger = logging.getLogger(__name__)

SupportersDetailedBalance = typing.NamedTuple("SupportersDetailedBalance",
                                              [("staked", int),
                                               ("staked_in_block", int),
                                               ("stopped", int),
                                               ("stopped_in_block", int),
                                               ])


class SupportersService:

    def __init__(self, contract: BlockChainContract):
        self._contract = contract

    async def supporters_call(self, method, *args, **kw):
        return await self._contract.bc_call(method, *args, **kw)

    async def supporters_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await self._contract.bc_execute(method, *args, account=account, wait=wait, **kw)

    async def get_token_addr(self):
        return await self.supporters_call("mocToken")

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