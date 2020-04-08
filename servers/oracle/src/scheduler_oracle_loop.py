import logging

from common.services import blockchain
from common.services.blockchain import BlockchainAccount, is_error
from common.services.coin_pair_price_service import CoinPairPriceService
from oracle.src import oracle_settings, oracle_service

logger = logging.getLogger(__name__)

SCHEDULER_POOL_DELAY = oracle_settings.SCHEDULER_POOL_DELAY
SCHEDULER_ROUND_DELAY = oracle_settings.SCHEDULER_ROUND_DELAY
SCHEDULER_ACCOUNT = BlockchainAccount(oracle_settings.SCHEDULER_SIGNING_ADDR,
                                      oracle_settings.SCHEDULER_SIGNING_KEY)


class CoinPairLoop():
    def __init__(self, cps: CoinPairPriceService):
        self.cps = cps
        self._coin_pair = cps.coin_pair

    async def run(self):
        self.log("Loop start")

        round_info = await self.cps.get_round_info()
        if not self._is_round_started(round_info):
            return False
        log("Round %r" % (round_info,))

        block_number = await blockchain.get_last_block()
        if not self._is_right_block(round_info, block_number):
            return False

        receipt = await self.cps.switch_round(account=SCHEDULER_ACCOUNT, wait=True)
        if is_error(receipt):
            self.error("Oracle scheduler error in switch_round tx %r" % (receipt,))
            return False

        log("round switched %r" % receipt.hash)
        return True

    def _is_round_started(self, round_info):
        if blockchain.is_error(round_info):
            self.error("Oracle scheduler error get_round_info error %r" % (round_info,))
            return False
        if round_info.round == 0:
            self.log("The system didn't started yet, wait %r" % (round_info,))
            return False
        return True

    def _is_right_block(self, round_info, block_number):
        if blockchain.is_error(block_number):
            self.error("Oracle scheduler error get_last_block error %r" % (block_number,))
            return False
        if round_info.lockPeriodEndBlock > block_number:
            self.log("The round is running, wait %r < %r " % (block_number, round_info.lockPeriodEndBlock))
            return False
        self.log("Current block %r" % block_number)
        return True

    def log(self, msg):
        logger.info("Oracle scheduler : %s -> %s" % (self._coin_pair, msg))

    def error(self, msg):
        logger.error("%s -> %s" % (self._coin_pair, msg))


def log(msg):
    logger.info("Oracle scheduler : %s" % msg)


async def scheduler_loop():
    log("Loop start")

    cpi = await oracle_service.get_all_coin_pair_service()
    if is_error(cpi):
        logger.error("Oracle scheduler error getting coin pairs info %r" % (cpi,))
        return SCHEDULER_POOL_DELAY

    success = True
    for cp in cpi:
        if not await CoinPairLoop(cp).run():
            success = False
    if success:
        return SCHEDULER_ROUND_DELAY
    return SCHEDULER_POOL_DELAY
