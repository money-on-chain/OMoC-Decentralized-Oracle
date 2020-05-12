import asyncio
import logging
from typing import List

from common.bg_task_executor import BgTaskExecutor
from common.services.ethernal_storage_service import EternalStorageService
from common.services.oracle_manager_service import OracleManagerService
from common.services.supporters_service import SupportersService
from oracle.src import oracle_settings, monitor
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from oracle.src.oracle_loop import OracleLoop
from oracle.src.oracle_service import OracleService
from oracle.src.scheduler_supporters_loop import SchedulerSupportersLoop

logger = logging.getLogger(__name__)


class MainExecutor:

    def __init__(self):
        self.eternal_storage_service = EternalStorageService()
        self.conf = OracleConfigurationLoop(self.eternal_storage_service)
        self.supporters_service = SupportersService()
        self.oracle_manager_service = OracleManagerService()
        self.oracle_service = OracleService(self.oracle_manager_service)
        self.oracle_loop = OracleLoop(self.conf, self.oracle_service)
        self.tasks: List[BgTaskExecutor] = [self.oracle_loop, self.conf]

    def web_server_startup(self):
        logger.info("=== Money-On-Chain Reference Oracle Starting up ===")
        logger.info("    Address: " + oracle_settings.get_oracle_account().addr)
        logger.info("    Loop main task interval: " + str(self.conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop per-coin task interval: " + str(self.conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop blockchain loop interval: " + str(self.conf.ORACLE_BLOCKCHAIN_INFO_INTERVAL))
        if oracle_settings.ORACLE_MONITOR_RUN:
            monitor.log_setup()
            self.tasks.append(monitor.MonitorTask(self.oracle_service))
        if oracle_settings.SCHEDULER_RUN_SUPPORTERS_SCHEDULER:
            self.tasks.append(SchedulerSupportersLoop(self.conf, self.supporters_service))
        for t in self.tasks:
            t.start_bg_task()

    def scheduler_alone_startup(self):
        self.web_server_startup()
        bg_tasks = [x.task for x in self.tasks]
        loop = asyncio.get_event_loop()
        loop.run_until_complete(asyncio.gather(*bg_tasks))

    def shutdown(self):
        for t in self.tasks:
            t.stop_bg_task()
