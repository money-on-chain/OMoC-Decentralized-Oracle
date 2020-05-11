import logging
from typing import List

from common.services import blockchain, oracle_manager_service
from common.services.blockchain import is_error
from common.services.coin_pair_price_service import CoinPairPriceService
from common.services.oracle_dao import CoinPair
from oracle.src import oracle_settings

logger = logging.getLogger(__name__)


async def get_all_oracles_info():
    oracles = {}
    it = await oracle_manager_service.get_registered_oracle_head()
    if is_error(it):
        return it
    while it != blockchain.ZERO_ADDR:
        oracle = await oracle_manager_service.get_oracle_registration_info(it)
        if is_error(oracle):
            return oracle
        it = await oracle_manager_service.get_registered_oracle_next(it)
        if is_error(it):
            return it
        oracles[oracle.addr] = oracle
    return oracles


async def get_oracle_service(coin_pair: CoinPair) -> CoinPairPriceService:
    bc_data = await oracle_manager_service.get_coin_pair_info(coin_pair)
    if is_error(bc_data):
        return bc_data
    return CoinPairPriceService(bc_data)


async def get_all_coin_pair_service() -> List[CoinPairPriceService]:
    coin_pairs = await oracle_manager_service.get_all_coin_pair()
    if is_error(coin_pairs):
        return coin_pairs
    ret = []
    for coin_pair in coin_pairs:
        bc_data = await get_oracle_service(coin_pair)
        if is_error(bc_data):
            return bc_data
        ret.append(bc_data)
    if len(oracle_settings.ORACLE_COIN_PAIR_FILTER) != 0:
        ret = [x for x in ret if str(x.coin_pair) in oracle_settings.ORACLE_COIN_PAIR_FILTER]
    return ret


async def get_subscribed_coin_pair_service(addr) -> List[CoinPairPriceService]:
    ret = await get_all_coin_pair_service()
    return [x for x in ret if await oracle_manager_service.is_subscribed(x.coin_pair, addr)]
