import logging
from typing import List

from common.bg_task_executor import BgTaskExecutor
from common.services.ethernal_storage_service import EternalStorageService
from common.services.moc_token_service import MocTokenService
from common.services.oracle_manager_service import OracleManagerService
from common.services.supporters_service import SupportersService
from oracle.src import oracle_settings, scheduler_supporters_loop, monitor
from oracle.src.oracle_loop import OracleLoop
from oracle.src.oracle_service import OracleService

logger = logging.getLogger(__name__)


class MainExecutor:

    def __init__(self):
        self.supporters_service = SupportersService()
        self.oracle_manager_service = OracleManagerService()
        self.oracle_service = OracleService(self.oracle_manager_service)
        self.moc_token_service = MocTokenService()
        self.eternal_storage_service = EternalStorageService()
        self.oracle_account = oracle_settings.get_oracle_account()
        self.oracle_loop = OracleLoop(self.oracle_account, self.oracle_service)
        self.tasks: List[BgTaskExecutor] = [self.oracle_loop]

    def setup(self):
        logger.info("=== Money-On-Chain Reference Oracle Starting up ===")
        logger.info("    Address: " + self.oracle_account.addr)
        logger.info("    Loop main task interval: " + str(oracle_settings.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop per-coin task interval: " + str(oracle_settings.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
        logger.info("    Loop blockchain loop interval: " + str(oracle_settings.ORACLE_BLOCKCHAIN_INFO_INTERVAL))
        if oracle_settings.ORACLE_MONITOR:
            monitor.log_setup()
            self.tasks.append(monitor.MonitorTask(self.oracle_service))
        if oracle_settings.SCHEDULER_RUN_SUPPORTERS_SCHEDULER:
            self.tasks.append(scheduler_supporters_loop.SchedulerSupportersLoop(self.supporters_service))

    def web_server_startup(self):
        self.setup()
        for t in self.tasks:
            t.start_bg_task()

    def bg_tasks(self):
        return [x.bg_task() for x in self.tasks]

    def shutdown(self):
        for t in self.tasks:
            t.stop_bg_task()
