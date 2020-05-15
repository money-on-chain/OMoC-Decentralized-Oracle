from common import helpers, settings
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount


class MocTokenService:
    MOC_ERC20_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "TestMOC.json")
    MOC_ERC20_ABI = MOC_ERC20_DATA["abi"]
    # MOC_ERC20_ADDR = blockchain.parse_addr(MOC_ERC20_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self, addr, abi=MOC_ERC20_ABI):
        self._moc_erc20_contract = blockchain.get_contract(addr, abi)

    async def moc_call(self, method, *args, **kw):
        return await blockchain.bc_call(self._moc_erc20_contract, method, *args, **kw)

    async def total_supply(self) -> int:
        return await self.moc_call("totalSupply")

    async def balance_of(self, address: BlockChainAddress) -> int:
        return await self.moc_call("balanceOf", address)

    async def allowance(self, owner: BlockChainAddress, spender: BlockChainAddress):
        return await self.moc_call("allowance", owner, spender)

    async def moc_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await blockchain.bc_execute(self._moc_erc20_contract, method, *args, account=account, wait=wait, **kw)

    async def transfer(self, receipient: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
        return await self.moc_execute("transfer", receipient, amount, account=account, wait=wait)

    async def approve(self, spender: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
        return await self.moc_execute("approve", spender, amount, account=account, wait=wait)

    async def transferFrom(self, sender: BlockChainAddress, recipient: BlockChainAddress, amount: int,
                           account: BlockchainAccount = None, wait=False):
        return await self.moc_execute("transferFrom", sender, recipient, amount, account=account, wait=wait)

    async def increaseAllowance(self, spender: BlockChainAddress, added_value: int, account: BlockchainAccount = None,
                                wait=False):
        return await self.moc_execute("increaseAllowance", spender, added_value, account=account, wait=wait)

    async def decreaseAllowance(self, spender: BlockChainAddress, subtracted_value: int,
                                account: BlockchainAccount = None,
                                wait=False):
        return await self.moc_execute("decreaseAllowance", spender, subtracted_value, account=account, wait=wait)

    async def mint(self, user: BlockChainAddress, amount: int, account: BlockchainAccount = None, wait=False):
        return await self.moc_execute("mint", user, amount, account=account, wait=wait)
