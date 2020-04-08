from common import helpers, settings
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount

MOC_ERC20_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "TestMOC.json")
MOC_ERC20_ABI = MOC_ERC20_DATA["abi"]
MOC_ERC20_ADDR = blockchain.parse_addr(MOC_ERC20_DATA["networks"][str(settings.NETWORK_ID)]["address"])
_moc_erc20_contract = blockchain.get_contract(MOC_ERC20_ADDR, MOC_ERC20_ABI)


async def moc_call(method, *args, **kw):
    return await blockchain.bc_call(_moc_erc20_contract, method, *args, **kw)


async def total_supply() -> int:
    return await moc_call("totalSupply")


async def balance_of(address: BlockChainAddress) -> int:
    return await moc_call("balanceOf", address)


async def allowance(owner: BlockChainAddress, spender: BlockChainAddress):
    return await moc_call("allowance", owner, spender)


async def moc_execute(method, *args, account: BlockchainAccount = None, wait=False, **kw):
    return await blockchain.bc_execute(_moc_erc20_contract, method, *args, account=account, wait=wait, **kw)


async def transfer(receipient: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
    return await moc_execute("transfer", receipient, amount, account=account, wait=wait)


async def approve(spender: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
    return await moc_execute("approve", spender, amount, account=account, wait=wait)


async def transferFrom(sender: BlockChainAddress, recipient: BlockChainAddress, amount: int,
                       account: BlockchainAccount = None, wait=False):
    return await moc_execute("transferFrom", sender, recipient, amount, account=account, wait=wait)


async def increaseAllowance(spender: BlockChainAddress, addedValue: int, account: BlockchainAccount = None, wait=False):
    return await moc_execute("increaseAllowance", spender, addedValue, account=account, wait=wait)


async def decreaseAllowance(spender: BlockChainAddress, subtractedValue: int, account: BlockchainAccount = None,
                            wait=False):
    return await moc_execute("decreaseAllowance", spender, subtractedValue, account=account, wait=wait)


async def mint(user: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
    return await moc_execute("mint", user, amount, account=account, wait=wait)
