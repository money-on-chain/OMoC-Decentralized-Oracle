import asyncio
import logging

import uvicorn
from colorlog import ColoredFormatter

from common import settings
from common.run_uvicorn import run_uvicorn
from oracle.src import oracle_settings
from oracle.src.main_executor import MainExecutor
from oracle.src.oracle_settings import ORACLE_RUN


def main():
    if ORACLE_RUN:
        run_uvicorn("oracle.src.app:app", oracle_settings.ORACLE_PORT)
        return

    # Only schedulers without the http server and the oracle coin pair loop.
    if settings.LOG_LEVEL not in uvicorn.config.LOG_LEVELS.keys():
        raise Exception("Invalid log level %s" % settings.LOG_LEVEL)
    # log_format = '%(log_color)s%(levelname)s:%(name)s:%(message)s'
    formatter = ColoredFormatter("%(log_color)s%(levelname)-8s%(reset)s %(message)s")
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger = logging.getLogger('')
    logger.setLevel(uvicorn.config.LOG_LEVELS[settings.LOG_LEVEL])
    logger.addHandler(handler)
    main_task = MainExecutor()
    try:
        main_task.setup()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(asyncio.gather(*main_task.bg_tasks()))
    except KeyboardInterrupt:
        pass
    finally:
        main_task.shutdown()


if __name__ == "__main__":
    main()
