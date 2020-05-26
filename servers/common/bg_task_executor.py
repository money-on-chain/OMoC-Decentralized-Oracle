import asyncio
import logging
import traceback

from common import settings

logger = logging.getLogger(__name__)


class BgTaskExecutor:

    def __init__(self, main=None, name=None, **kwargs):
        super().__init__(**kwargs)
        self.name = name
        self.task = None
        self.cancel = False
        self.main_loop = main

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
        logger.info("Bg task stop %r" % self.name)

    def start_bg_task(self):
        self.task = asyncio.create_task(self.bg_task())
        return self.task

    def stop_bg_task(self):
        self.cancel = True
        if self.task:
            self.task.cancel()
            self.task = None
