import logging

from common.services import blockchain, supporters_service
from common.services.blockchain import BlockchainAccount, is_error
from oracle.src import oracle_settings

logger = logging.getLogger(__name__)

SCHEDULER_POOL_DELAY = oracle_settings.SCHEDULER_POOL_DELAY
SCHEDULER_ROUND_DELAY = oracle_settings.SCHEDULER_ROUND_DELAY
SCHEDULER_ACCOUNT = BlockchainAccount(oracle_settings.SCHEDULER_SIGNING_ADDR,
                                      oracle_settings.SCHEDULER_SIGNING_KEY)


def log(msg):
    logger.info("Supporters scheduler : %s" % msg)


async def scheduler_loop():
    log("Loop start")

    is_ready_to_distribute = await supporters_service.is_ready_to_distribute()
    if blockchain.is_error(is_ready_to_distribute):
        logger.error("Supporters oracles error getting is_ready_to_distribute %r" % (is_ready_to_distribute,))
        return SCHEDULER_POOL_DELAY

    if not is_ready_to_distribute:
        logger.info("Not ready to distribute, wait...")
        return SCHEDULER_POOL_DELAY

    receipt = await supporters_service.distribute(account=SCHEDULER_ACCOUNT, wait=True)
    if is_error(receipt):
        logger.error("Error in distribute tx %r" % (receipt,))
        return SCHEDULER_POOL_DELAY

    log("round switched %r" % receipt.hash)
    return SCHEDULER_ROUND_DELAY
