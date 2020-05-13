import asyncio
import logging
import traceback

from common import settings

logger = logging.getLogger(__name__)


class BgTaskExecutor:

    def __init__(self, main_loop):
        self.task = None
        self.cancel = False
        self.main_loop = main_loop

    async def bg_task(self):
        while not self.cancel:
            try:
                sleep = await self.main_loop()
                if not sleep:
                    raise ValueError("invalid delay")
                await asyncio.sleep(sleep)
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.error(exc)
                if settings.ON_ERROR_PRINT_STACK_TRACE:
                    logger.error(traceback.format_exc())
                logger.info("Retrying...")
                await asyncio.sleep(1)
        logger.info("MONITOR STOP")

    def start_bg_task(self):
        self.task = asyncio.create_task(self.bg_task())

    def stop_bg_task(self):
        self.cancel = True
        if self.task:
            self.task.cancel()
            self.task = None
