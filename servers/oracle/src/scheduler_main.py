import asyncio
import logging

from colorlog import ColoredFormatter

from common import settings
from common.bg_task_executor import BgTaskExecutor
from oracle.src import scheduler_oracle_loop, scheduler_supporters_loop, oracle_settings


def run_schedulers():
    LOG_LEVELS = {
        "critical": logging.CRITICAL,
        "error": logging.ERROR,
        "warning": logging.WARNING,
        "info": logging.INFO,
        "debug": logging.DEBUG,
    }
    if settings.LOG_LEVEL not in LOG_LEVELS.keys():
        raise Exception("Invalid log level %s" % settings.LOG_LEVEL)
    log_format = '%(log_color)s%(levelname)s:%(name)s:%(message)s'

    formatter = ColoredFormatter("%(log_color)s%(levelname)-8s%(reset)s %(message)s")
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger = logging.getLogger('')
    logger.setLevel(LOG_LEVELS[settings.LOG_LEVEL])
    logger.addHandler(handler)
    # Only schedullers
    executors = []
    if oracle_settings.SCHEDULER_RUN_ORACLE_SCHEDULER:
        executors.append(BgTaskExecutor(scheduler_oracle_loop.scheduler_loop))
    if oracle_settings.SCHEDULER_RUN_SUPPORTERS_SCHEDULER:
        executors.append(BgTaskExecutor(scheduler_supporters_loop.scheduler_loop))

    if len(executors) == 0:
        logger.error("Nothing to do, did you missed some X_RUN configuration variable?");
        return

    try:
        loop = asyncio.get_event_loop()
        tasks = [x.bg_task() for x in executors]
        loop.run_until_complete(asyncio.gather(*tasks))
    except KeyboardInterrupt:
        pass
