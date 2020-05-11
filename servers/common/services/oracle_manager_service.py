import logging
from typing import List

from common import helpers, settings
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount, is_error
from common.services.oracle_dao import CoinPair, CoinPairInfo, OracleRegistrationInfo

logger = logging.getLogger(__name__)


class OracleManagerService:
    ORACLE_MANAGER_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "OracleManager.json")
    ORACLE_MANAGER_ABI = ORACLE_MANAGER_DATA["abi"]
    ORACLE_MANAGER_ADDR = blockchain.parse_addr(ORACLE_MANAGER_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self, addr=ORACLE_MANAGER_ADDR, abi=ORACLE_MANAGER_ABI):
        self._oracle_manager_contract = blockchain.get_contract(addr, abi)

    async def oracle_manager_call(self, method, *args, **kw):
        return await blockchain.bc_call(self._oracle_manager_contract, method, *args, **kw)

    async def oracle_manager_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await blockchain.bc_execute(self._oracle_manager_contract, method, *args,
                                           account=account, wait=wait, **kw)

    async def get_min_oracle_owner_stake(self):
        return await self.oracle_manager_call("minOracleOwnerStake")

    async def register_oracle(self, address: BlockChainAddress, name: str, stake: int,
                              account: BlockchainAccount = None,
                              wait=False):
        return await self.oracle_manager_execute("registerOracle", address, name, stake, account=account, wait=wait)

    async def register_oracle_with_hint(self, address: BlockChainAddress, name: str, stake: int,
                                        prev_entry: BlockChainAddress,
                                        account: BlockchainAccount = None,
                                        wait=False):
        return await self.oracle_manager_execute("RegisterOracleWithHint", address, name, stake, prev_entry,
                                                 account=account,
                                                 wait=wait)

    async def add_stake(self, address: BlockChainAddress, stake: int, account: BlockchainAccount = None,
                        wait=False):
        return await self.oracle_manager_execute("addStake", address, stake, account=account, wait=wait)

    async def add_stake_with_hint(self, address: BlockChainAddress, stake: int, prev_entry: BlockChainAddress,
                                  account: BlockchainAccount = None,
                                  wait=False):
        return await self.oracle_manager_execute("AddStakeWithHint", address, stake, prev_entry, account=account,
                                                 wait=wait)

    async def subscribe_coin_pair(self, coin_pair: CoinPair, address: BlockChainAddress,
                                  account: BlockchainAccount = None,
                                  wait=False):
        return await self.oracle_manager_execute("suscribeCoinPair", address, coin_pair.longer(), account=account,
                                                 wait=wait)

    async def unsubscribe_coin_pair(self, coin_pair: CoinPair, address: BlockChainAddress,
                                    account: BlockchainAccount = None,
                                    wait=False):
        return await self.oracle_manager_execute("unsuscribeCoinPair", address, coin_pair.longer(), account=account,
                                                 wait=wait)

    async def is_subscribed(self, coin_pair: CoinPair, address: BlockChainAddress) -> bool:
        return await self.oracle_manager_call("isSuscribed", address, coin_pair.longer())

    async def get_registered_oracle_head(self):
        return await self.oracle_manager_call("getRegisteredOracleHead")

    async def get_registered_oracle_next(self, it: BlockChainAddress):
        return await self.oracle_manager_call("getRegisteredOracleNext", it)

    async def get_prev_by_addr(self, address: BlockChainAddress):
        return await self.oracle_manager_call("getPrevByAddr", address)

    async def get_prev_by_addr_with_hint(self, address: BlockChainAddress, prevEntry: BlockChainAddress):
        return await self.oracle_manager_call("getPrevByAddrWithHint", address, prevEntry)

    async def get_prev_by_stake(self, stake: int):
        return await self.oracle_manager_call("getPrevByStake", stake)

    async def get_prev_by_addr_with_hint(self, stake: int, prevEntry: BlockChainAddress):
        return await self.oracle_manager_call("getPrevByStakeWithHint", stake, prevEntry)

    async def set_oracle_name(self, address: BlockChainAddress, name: str, account: BlockchainAccount = None,
                              wait=False):
        return await self.oracle_manager_execute("SetOracleName", address, name, account=account, wait=wait)

    async def is_oracle_registered(self, address: BlockChainAddress):
        return await self.oracle_manager_call("isOracleRegistered", address)

    async def get_oracle_registration_info(self, address: BlockChainAddress) -> OracleRegistrationInfo:
        bc_data = await self.oracle_manager_call("getOracleRegistrationInfo", address)
        if is_error(bc_data):
            return bc_data
        return OracleRegistrationInfo(address, *bc_data)

    async def remove_oracle(self, address: BlockChainAddress, account: BlockchainAccount = None, wait=False):
        return await self.oracle_manager_execute("removeOracle", address, account=account, wait=wait)

    async def remove_oracle_with_hint(self, address: BlockChainAddress, prev_entry: BlockChainAddress,
                                      account: BlockchainAccount = None,
                                      wait=False):
        return await self.oracle_manager_execute("removeOracleWithHint", address, prev_entry, account=account,
                                                 wait=wait)

    async def get_coin_pair_info(self, coin_pair: CoinPair) -> CoinPairInfo:
        bc_data = await self.oracle_manager_call("getContractAddress", coin_pair.longer())
        if is_error(bc_data):
            return bc_data
        return CoinPairInfo(coin_pair, bc_data)

    async def get_all_coin_pair(self) -> List[CoinPair]:
        bc_count = await self.oracle_manager_call("getCoinPairCount")
        if is_error(bc_count):
            return bc_count
        ret = []
        for i in range(bc_count):
            bc_data = await self.oracle_manager_call("getCoinPairAtIndex", i)
            if is_error(bc_data):
                return bc_data
            ret.append(CoinPair(bc_data.decode("ascii")))
        return ret
