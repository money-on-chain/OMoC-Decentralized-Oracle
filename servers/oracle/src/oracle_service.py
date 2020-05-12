import logging
from typing import List

from common.services import blockchain
from common.services.blockchain import is_error
from common.services.coin_pair_price_service import CoinPairPriceService
from common.services.oracle_dao import CoinPair
from common.services.oracle_manager_service import OracleManagerService
from oracle.src import oracle_settings

logger = logging.getLogger(__name__)


class OracleService:
    def __init__(self, oracle_manager_service: OracleManagerService):
        self.oracle_manager_service = oracle_manager_service

    async def get_all_oracles_info(self):
        oracles = {}
        it = await self.oracle_manager_service.get_registered_oracle_head()
        if is_error(it):
            return it
        while it != blockchain.ZERO_ADDR:
            oracle = await self.oracle_manager_service.get_oracle_registration_info(it)
            if is_error(oracle):
                return oracle
            it = await self.oracle_manager_service.get_registered_oracle_next(it)
            if is_error(it):
                return it
            oracles[oracle.addr] = oracle
        return oracles

    async def get_coin_pair_service(self, coin_pair: CoinPair) -> CoinPairPriceService:
        bc_data = await self.oracle_manager_service.get_coin_pair_info(coin_pair)
        if is_error(bc_data):
            return bc_data
        return CoinPairPriceService(self.oracle_manager_service, bc_data)

    async def get_all_coin_pair_services(self) -> List[CoinPairPriceService]:
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

    async def get_subscribed_coin_pair_services(self, addr) -> List[CoinPairPriceService]:
        ret = await self.get_all_coin_pair_services()
        return [x for x in ret if await self.oracle_manager_service.is_subscribed(x.coin_pair, addr)]
