import logging
from typing import List

from hexbytes import HexBytes

from common import settings, helpers
from common.helpers import hb_to_bytes
from common.services import blockchain
from common.services.blockchain import BlockChainAddress, BlockchainAccount, is_error
from common.services.oracle_dao import OracleRoundInfo, RoundInfo, CoinPair, CoinPairInfo
from common.services.oracle_manager_service import OracleManagerService

logger = logging.getLogger(__name__)


class CoinPairPriceService:
    COIN_PAIR_PRICE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "CoinPairPrice.json")
    COIN_PAIR_PRICE_ABI = COIN_PAIR_PRICE_DATA["abi"]

    def __init__(self, oracle_manager_service: OracleManagerService, coin_pair_info: CoinPairInfo):
        self._oracle_manager_service = oracle_manager_service
        self._coin_pair_info = coin_pair_info
        self._coin_pair_price_contract = blockchain.get_contract(coin_pair_info.addr, self.COIN_PAIR_PRICE_ABI)

    @property
    def coin_pair(self) -> CoinPair:
        return self._coin_pair_info.coin_pair

    @property
    def addr(self) -> BlockChainAddress:
        return self._coin_pair_info.addr

    async def coin_pair_price_call(self, method, *args, account: BlockchainAccount = None, **kw):
        return await blockchain.bc_call(self._coin_pair_price_contract, method, *args, account=account, **kw)

    async def coin_pair_price_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await blockchain.bc_execute(self._coin_pair_price_contract, method, *args, account=account, wait=wait,
                                           **kw)

    async def get_num_idle_rounds(self):
        return await self.coin_pair_price_call("numIdleRounds")

    async def get_round_lock_period_in_blocks(self):
        return await self.coin_pair_price_call("roundLockPeriodInBlocks")

    async def get_max_oracles_per_rounds(self):
        return await self.coin_pair_price_call("maxOraclesPerRound")

    async def can_remove_oracle(self, addr: BlockChainAddress):
        return await self.coin_pair_price_call("canRemoveOracle", addr)

    async def get_price(self):
        return await self.coin_pair_price_call("getPrice", account="0x" + "0" * 39 + "1")

    async def get_available_reward_fees(self):
        return await self.coin_pair_price_call("getAvailableRewardFees")

    async def publish_price(self,
                            version,
                            coin_pair,
                            price,
                            oracle_addr,
                            blocknumber,
                            signatures: List[HexBytes],
                            account: BlockchainAccount = None,
                            wait=False):
        v, r, s = [], [], []
        for signature in signatures:
            v.append(int.from_bytes(hb_to_bytes(signature[64:]), "little"))
            r.append(hb_to_bytes(signature[:32]))
            s.append(hb_to_bytes(signature[32:64]))

        return await self.coin_pair_price_execute("publishPrice", version,
                                                  coin_pair.longer(), price, oracle_addr,
                                                  blocknumber, v, r, s, account=account, wait=wait)

    async def get_coin_pair(self) -> str:
        return await self.coin_pair_price_call("coinPair")

    async def get_last_pub_block(self) -> int:
        return await self.coin_pair_price_call("getLastPublicationBlock")

    async def get_last_pub_block_hash(self, last_pub_block=None):
        if last_pub_block is None:
            last_pub_block = await self.get_last_pub_block()
        return (await blockchain.get_block_by_number(last_pub_block)).hash
        # return hashlib.sha3_256(str(last_pub_block).encode('ascii')).digest()

    async def get_round_info(self) -> RoundInfo:
        bc_data = await self.coin_pair_price_call("getRoundInfo")
        if is_error(bc_data):
            return bc_data
        return RoundInfo(*bc_data)

    async def get_oracle_round_info(self, address: BlockChainAddress) -> OracleRoundInfo:
        registration_info = await self._oracle_manager_service.get_oracle_registration_info(address)
        if is_error(registration_info):
            return registration_info
        bc_data = await self.coin_pair_price_call("getOracleRoundInfo", address)
        if is_error(bc_data):
            return bc_data
        return OracleRoundInfo(*registration_info, *bc_data)

    async def switch_round(self, account: BlockchainAccount = None, wait=False):
        return await self.coin_pair_price_execute("switchRound", account=account, wait=wait)

    async def get_selected_oracles_info(self) -> List[OracleRoundInfo]:
        oracles = []
        round_info: RoundInfo = await self.get_round_info()
        if is_error(round_info):
            return round_info
        for addr in round_info.selectedOracles:
            info = await self.get_oracle_round_info(addr)
            if is_error(info):
                return info
            oracles.append(info)
        return oracles
