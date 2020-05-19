import logging
from typing import List

from common.services.blockchain import ZERO_ADDR, is_error
from common.services.contract_factory_service import ContractFactoryService
from common.services.oracle_dao import CoinPair
from oracle.src import oracle_settings
from oracle.src.oracle_coin_pair_service import OracleCoinPairService

logger = logging.getLogger(__name__)


class OracleService:
    def __init__(self, contract_factory: ContractFactoryService, oracle_manager_addr: str):
        self.contract_factory = contract_factory
        self.oracle_manager_service = contract_factory.get_oracle_manager(oracle_manager_addr)

    async def get_token_addr(self):
        return await self.oracle_manager_service.get_token_addr()

    async def get_all_oracles_info(self):
        oracles = {}
        it = await self.oracle_manager_service.get_registered_oracle_head()
        if is_error(it):
            return it
        while it != ZERO_ADDR:
            oracle = await self.oracle_manager_service.get_oracle_registration_info(it)
            if is_error(oracle):
                return oracle
            it = await self.oracle_manager_service.get_registered_oracle_next(it)
            if is_error(it):
                return it
            oracles[oracle.addr] = oracle
        return oracles

    # CoinPairPriceService factory
    async def get_coin_pair_service(self, coin_pair: CoinPair) -> OracleCoinPairService:
        coin_pair_info = await self.oracle_manager_service.get_coin_pair_info(coin_pair)
        if is_error(coin_pair_info):
            return coin_pair_info
        return OracleCoinPairService(self.contract_factory.get_blockchain(),
                                     self.contract_factory.get_coin_pair_price(coin_pair_info.addr),
                                     self.oracle_manager_service,
                                     coin_pair_info)

    async def get_all_coin_pair_services(self) -> List[OracleCoinPairService]:
        coin_pairs = await self.oracle_manager_service.get_all_coin_pair()
        if is_error(coin_pairs):
            return coin_pairs
        ret = []
        for coin_pair in coin_pairs:
            bc_data = await self.get_coin_pair_service(coin_pair)
            if is_error(bc_data):
                return bc_data
            ret.append(bc_data)
        if len(oracle_settings.ORACLE_COIN_PAIR_FILTER) != 0:
            ret = [x for x in ret if str(x.coin_pair) in oracle_settings.ORACLE_COIN_PAIR_FILTER]
        return ret

    async def get_subscribed_coin_pair_services(self, addr) -> List[OracleCoinPairService]:
        ret = await self.get_all_coin_pair_services()
        if is_error(ret):
            return ret
        return [x for x in ret if await self.oracle_manager_service.is_subscribed(x.coin_pair, addr)]
