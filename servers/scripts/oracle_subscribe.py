from common import helpers
from common.services.oracle_manager_service import OracleManagerService
from scripts import script_settings


async def main():
    oracle_account = script_settings.SCRIPT_ORACLE_ACCOUNT
    oracle_addr = str(oracle_account.addr)
    print("ORACLE ADDR", oracle_addr)
    print("ORACLE OWNER ADDR", script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)

    conf = await script_settings.configure()
    oracle_manager_service = OracleManagerService(conf.ORACLE_MANAGER_ADDR)

    registered = await oracle_manager_service.is_oracle_registered(oracle_addr)
    if not registered:
        print("ORACLE NOT REGISTERED")
        return

    for cp in script_settings.USE_COIN_PAIR:
        is_subscribed = await oracle_manager_service.is_subscribed(cp, oracle_addr)
        print(cp, " IS SUBSCRIBED: ", is_subscribed)
        if not is_subscribed:
            tx = await oracle_manager_service.subscribe_coin_pair(cp, oracle_addr,
                                                                  account=script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT,
                                                                  wait=True)

            print("register oracle for coinpar", cp, " result ", tx)


if __name__ == '__main__':
    helpers.run_main(main)
