import asyncio
import logging
import time
import typing

from common.bg_task_executor import BgTaskExecutor
from common.services import blockchain
from common.services.blockchain import is_error
from common.services.oracle_dao import CoinPair
from oracle.src.oracle_coin_pair_service import FullOracleRoundInfo, OracleCoinPairService
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop

logger = logging.getLogger(__name__)

OracleBlockchainInfo = typing.NamedTuple("OracleBlockchainInfo",
                                         [("coin_pair", CoinPair),
                                          ('selected_oracles', typing.List[FullOracleRoundInfo]),
                                          ('blockchain_price', int),
                                          ('block_num', int),
                                          ('last_pub_block', int),
                                          ('last_pub_block_hash', str),
                                          ])


class OracleBlockchainInfoLoop(BgTaskExecutor):
    def __init__(self, conf: OracleConfigurationLoop, cps: OracleCoinPairService):
        self._conf = conf
        self._cps = cps
        self._coin_pair = cps.coin_pair
        self._blockchain_info: OracleBlockchainInfo = None
        self.last_update = None
        self.update_lock = asyncio.Lock()
        super().__init__(self.task_loop)

    async def task_loop(self):
        delta = self._conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL
        async with self.update_lock:
            if self.last_update:
                delta = (time.time() - self.last_update)
        if delta < self._conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL:
            return self._conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL - delta
        await self.force_update()
        return self._conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL

    async def force_update(self):
        async with self.update_lock:
            self.last_update = time.time()

        data = await self._get_blocking()
        if data:
            self._blockchain_info = data

    def get(self) -> OracleBlockchainInfo:
        return self._blockchain_info

    async def _get_blocking(self) -> OracleBlockchainInfo:
        async def _get_last_pub_data():
            lpb = await self._cps.get_last_pub_block()
            lpbh = await self._cps.get_last_pub_block_hash(lpb)
            return lpb, lpbh

        cors = [self._cps.get_selected_oracles_info(),
                self._cps.get_price(),
                blockchain.get_last_block(),
                _get_last_pub_data()]
        ret = await asyncio.gather(*cors, return_exceptions=True)
        if any(is_error(elem) for elem in ret):
            logger.warning("Error getting blockchain info %r" % (ret,))
            return None
        (selected_oracles, blockchain_price, block_num, (last_pub_block, last_pub_block_hash)) = ret
        return OracleBlockchainInfo(self._coin_pair, selected_oracles,
                                    blockchain_price, block_num, last_pub_block, last_pub_block_hash)
