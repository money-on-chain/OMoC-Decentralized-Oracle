from common import helpers
from common.services.blockchain import is_error
from common.services.oracle_manager_service import OracleManagerService
from oracle.src.oracle_service import OracleService
from scripts import script_settings


async def main():
    conf = await script_settings.configure()
    oracle_manager_service = OracleManagerService(conf.ORACLE_MANAGER_ADDR)
    oracle_service = OracleService(oracle_manager_service)
    for cp in script_settings.USE_COIN_PAIR:
        cps = await oracle_service.get_coin_pair_service(cp)
        if is_error(cps):
            print("Error getting coin pair service for coin pair", cp, cps)
            continue

        print("get round info")
        round_info = await cps.get_round_info()
        if round_info.round != 0:
            print("Already started, round", round_info.round)
            return
        print(repr(round_info))

        print("start initial round")
        tx = await cps.switch_round(account=script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT, wait=True)
        print("start initial round", tx)


if __name__ == '__main__':
    helpers.run_main(main)
