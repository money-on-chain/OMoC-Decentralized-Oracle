import asyncio
import logging
from typing import List

from common import settings
from common.bg_task_executor import BgTaskExecutor
from common.services.contract_factory_service import ContractFactoryService
from oracle.src import oracle_settings, monitor
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from oracle.src.oracle_loop import OracleLoop
from oracle.src.oracle_service import OracleService
from oracle.src.scheduler_supporters_loop import SchedulerSupportersLoop

logger = logging.getLogger(__name__)


class MainExecutor:

    def __init__(self):
        self.cf = ContractFactoryService.get_contract_factory_service()
        self.conf = OracleConfigurationLoop(self.cf)
        self.tasks: List[BgTaskExecutor] = [self.conf]

    async def web_server_startup(self):
        await self._startup()

    async def scheduler_alone_startup(self):
        await self._startup()
        bg_tasks = [x.task for x in self.tasks]
        await asyncio.gather(*bg_tasks)

    async def _startup(self):
        await self.conf.initialize()
        self.supporters_service = self.cf.get_supporters(self.conf.SUPPORTERS_VESTED_ADDR)
        self.oracle_service = OracleService(self.cf, self.conf.ORACLE_MANAGER_ADDR)
        self.oracle_loop = OracleLoop(self.conf, self.oracle_service)
        self.tasks.append(self.oracle_loop)

        logger.info("=== Money-On-Chain Reference Oracle Starting up ===")
        logger.info("    Address: " + oracle_settings.get_oracle_account().addr)
        logger.info("    Loop main task interval: " + str(self.conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop per-coin task interval: " + str(self.conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop blockchain loop interval: " + str(self.conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL))
        logger.info("    Loop blockchain loop interval: " + str(self.conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL))
        if settings.DEBUG:
            logger.info("    DEBUG")
        if settings.CONTRACT_ROOT_FOLDER:
            logger.info("    DEBUG")
        if settings.DEBUG:
            logger.info("    DEBUG")
        if oracle_settings.ORACLE_MONITOR_RUN:
            monitor.log_setup()
            self.tasks.append(monitor.MonitorTask(self.oracle_service))
        if oracle_settings.SCHEDULER_RUN_SUPPORTERS_SCHEDULER:
            self.tasks.append(SchedulerSupportersLoop(self.conf, self.supporters_service))
        for t in self.tasks:
            t.start_bg_task()

    def shutdown(self):
        for t in self.tasks:
            t.stop_bg_task()
