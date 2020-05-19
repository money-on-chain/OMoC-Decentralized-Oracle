import logging
import typing
from typing import List

from common.services import blockchain
from common.services.blockchain import is_error, BlockChainAddress, BlockchainAccount
from common.services.coin_pair_price_service import CoinPairService
from common.services.oracle_dao import CoinPair, CoinPairInfo, RoundInfo
from common.services.oracle_manager_service import OracleManagerService

logger = logging.getLogger(__name__)

FullOracleRoundInfo = typing.NamedTuple("FullOracleRoundInfo",
                                        [("addr", str),
                                         ('internetName', str),
                                         ("stake", int),
                                         ("owner", str),
                                         ("points", int),
                                         ("selectedInCurrentRound", bool),
                                         ("selectedInRound", int)
                                         ])


class OracleCoinPairService:
    def __init__(self, coin_pair_service: CoinPairService,
                 oracle_manager_service: OracleManagerService,
                 coin_pair_info: CoinPairInfo):
        self._coin_pair_service = coin_pair_service
        self._oracle_manager_service = oracle_manager_service
        self._coin_pair_info = coin_pair_info

    @property
    def coin_pair(self) -> CoinPair:
        return self._coin_pair_info.coin_pair

    @property
    def addr(self) -> BlockChainAddress:
        return self._coin_pair_info.addr

    async def get_selected_oracles_info(self) -> List[FullOracleRoundInfo]:
        oracles = []
        round_info: RoundInfo = await self._coin_pair_service.get_round_info()
        if is_error(round_info):
            return round_info
        for addr in round_info.selectedOracles:
            info = await self.get_oracle_round_info(addr)
            if is_error(info):
                return info
            oracles.append(info)
        return oracles

    async def get_oracle_round_info(self, address: BlockChainAddress) -> FullOracleRoundInfo:
        registration_info = await self._oracle_manager_service.get_oracle_registration_info(address)
        if is_error(registration_info):
            return registration_info
        bc_data = await self._coin_pair_service.get_oracle_round_info(address)
        if is_error(bc_data):
            return bc_data
        return FullOracleRoundInfo(*registration_info, *bc_data)

    async def get_last_pub_block_hash(self, last_pub_block=None):
        if last_pub_block is None:
            last_pub_block = await self.get_last_pub_block()
        return (await blockchain.get_block_by_number(last_pub_block)).hash
        # return hashlib.sha3_256(str(last_pub_block).encode('ascii')).digest()

    async def get_price(self):
        return await self._coin_pair_service.get_price()

    async def get_num_idle_rounds(self):
        return await self._coin_pair_service.get_num_idle_rounds()

    async def get_round_lock_period_in_blocks(self):
        return await self._coin_pair_service.get_round_lock_period_in_blocks()

    async def get_max_oracles_per_rounds(self):
        return await self._coin_pair_service.get_max_oracles_per_rounds()

    async def can_remove_oracle(self, addr: BlockChainAddress):
        return await self._coin_pair_service.can_remove_oracle(addr)

    async def get_price(self):
        return await self._coin_pair_service.get_price()

    async def get_available_reward_fees(self):
        return await self._coin_pair_service.get_available_reward_fees()

    async def publish_price(self,
                            version,
                            coin_pair,
                            price,
                            oracle_addr,
                            blocknumber,
                            signatures,
                            account: BlockchainAccount = None,
                            wait=False):
        return await self._coin_pair_service.publish_price(version, coin_pair, price,
                                                           oracle_addr, blocknumber, signatures,
                                                           account=account, wait=wait)

    async def get_coin_pair(self) -> str:
        return await self._coin_pair_service.get_coin_pair()

    async def get_last_pub_block(self) -> int:
        return await self._coin_pair_service.get_last_pub_block()

    async def get_round_info(self) -> RoundInfo:
        return await self._coin_pair_service.get_round_info()

    async def switch_round(self, account: BlockchainAccount = None, wait=False):
        return await self._coin_pair_service.switch_round(account=account, wait=wait)
