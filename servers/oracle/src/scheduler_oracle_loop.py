import logging

from common.bg_task_executor import BgTaskExecutor
from common.services.blockchain import is_error
from oracle.src import oracle_settings
from oracle.src.oracle_coin_pair_service import OracleCoinPairService
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop

logger = logging.getLogger(__name__)


class SchedulerCoinPairLoop(BgTaskExecutor):
    def __init__(self, conf: OracleConfigurationLoop, cps: OracleCoinPairService):
        self._conf = conf
        self._cps = cps
        self._coin_pair = cps.coin_pair
        super().__init__(self.run)

    async def run(self):
        self.log("start")

        round_info = await self._cps.get_round_info()
        if not self._is_round_started(round_info):
            return self._conf.SCHEDULER_POOL_DELAY
        self.log("Round %r" % (round_info,))

        block_number = await self._cps.get_last_block()
        if not self._is_right_block(round_info, block_number):
            return self._conf.SCHEDULER_POOL_DELAY

        receipt = await self._cps.switch_round(account=oracle_settings.get_oracle_scheduler_account(), wait=True)
        if is_error(receipt):
            self.error("error in switch_round tx %r" % (receipt,))
            return self._conf.SCHEDULER_POOL_DELAY

        self.log("round switched %r" % (receipt.hash,))
        return self._conf.SCHEDULER_ROUND_DELAY

    def _is_round_started(self, round_info):
        if is_error(round_info):
            self.error("error get_round_info error %r" % (round_info,))
            return False
        if round_info.round == 0:
            self.log("The system didn't started yet, wait %r" % (round_info,))
            return False
        return True

    def _is_right_block(self, round_info, block_number):
        if is_error(block_number):
            self.error("error get_last_block error %r" % (block_number,))
            return False
        if round_info.lockPeriodEndBlock > block_number:
            self.log("The round is running, wait %r < %r " %
                     (block_number, round_info.lockPeriodEndBlock))
            return False
        self.log("Current block %r" % (block_number,))
        return True

    def log(self, msg):
        logger.info("%r : SchedulerCoinPairLoop : %s" % (self._coin_pair, msg))

    def error(self, msg):
        logger.error("%r : SchedulerCoinPairLoop : %s" % (self._coin_pair, msg))
