import logging
import typing

from common import settings, helpers
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount, is_error

logger = logging.getLogger(__name__)

SupportersDetailedBalance = typing.NamedTuple("SupportersDetailedBalance",
                                              [("staked", int),
                                               ("staked_in_block", int),
                                               ("stopped", int),
                                               ("stopped_in_block", int),
                                               ])

SUPPORTERS_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "SupportersVested.json")
SUPPORTERS_ABI = SUPPORTERS_DATA["abi"]
SUPPORTERS_ADDR = blockchain.parse_addr(SUPPORTERS_DATA["networks"][str(settings.NETWORK_ID)]["address"])
_supporters_contract = blockchain.get_contract(SUPPORTERS_ADDR, SUPPORTERS_ABI)


async def supporters_call(method, *args, **kw):
    return await blockchain.bc_call(_supporters_contract, method, *args, **kw)


async def supporters_execute(method, *args, account: BlockchainAccount = None, wait=False, **kw):
    return await blockchain.bc_execute(_supporters_contract, method, *args, account=account, wait=wait, **kw)


async def distribute(account: BlockchainAccount = None, wait=False):
    return await supporters_execute("distribute", account=account, wait=wait)


async def add_stake(mocs: int, account: BlockchainAccount = None, wait=False):
    return await supporters_execute("addStake", mocs, account=account, wait=wait)


async def stop(account: BlockchainAccount = None, wait=False):
    return await supporters_execute("stop", account=account, wait=wait)


async def restart(account: BlockchainAccount = None, wait=False):
    return await supporters_execute("reStake", account=account, wait=wait)


async def withdraw(account: BlockchainAccount = None, wait=False):
    return await supporters_execute("withdraw", account=account, wait=wait)


async def balance_of(addr: BlockChainAddress):
    return await supporters_call("balanceOf", addr)


async def detailed_balance_of(addr: BlockChainAddress) -> SupportersDetailedBalance:
    data = await supporters_call("detailedBalanceOf", addr)
    return SupportersDetailedBalance(*data)


async def is_ready_to_distribute() -> bool:
    return await supporters_call("isReadyToDistribute")
