import logging

from colorlog import ColoredFormatter

from common import helpers
from oracle.src import oracle_settings
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from scripts import script_settings


async def main():
    formatter = ColoredFormatter("%(log_color)s%(levelname)-8s%(reset)s %(message)s")
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger = logging.getLogger('')
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    loop = OracleConfigurationLoop(script_settings.cf.get_eternal_storage(oracle_settings.get_registry_addr()))
    for (p, param) in loop.parameters.items():
        p_path = loop.get_registry_path(p)
        print(p, await param["blockchain"](p_path))
        print("\t", param["description"])


if __name__ == '__main__':
    helpers.run_main(main)
