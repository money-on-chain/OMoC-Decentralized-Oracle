import logging

from colorlog import ColoredFormatter

from common import helpers
from common.services.ethernal_storage_service import EternalStorageService
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop


async def main():
    formatter = ColoredFormatter("%(log_color)s%(levelname)-8s%(reset)s %(message)s")
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger = logging.getLogger('')
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    b = "ORACLE_STAKE_LIMIT_MULTIPLICATOR"
    k = "MOC_ORACLE\\1\\" + b
    registry = EternalStorageService()
    print("--------------------------------> RESULT", await registry.get_uint(k))

    loop = OracleConfigurationLoop(registry)
    await loop.initialize()


if __name__ == '__main__':
    helpers.run_main(main)
