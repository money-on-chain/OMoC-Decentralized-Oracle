from common import helpers
from common.services.oracle_manager_service import OracleManagerService
from scripts import script_settings

ORACLE_ACCOUNT = script_settings.SCRIPT_ORACLE_ACCOUNT
ORACLE_ADDR = str(ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)

oracle_manager_service = OracleManagerService()


async def main():
    registered = await oracle_manager_service.is_oracle_registered(ORACLE_ADDR)
    if not registered:
        print("ORACLE NOT REGISTERED")
        return

    for cp in script_settings.USE_COIN_PAIR:
        is_subscribed = await oracle_manager_service.is_subscribed(cp, ORACLE_ADDR)
        print(cp, " IS SUBSCRIBED: ", is_subscribed)
        if not is_subscribed:
            tx = await oracle_manager_service.subscribe_coin_pair(cp, ORACLE_ADDR,
                                                                  account=script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT,
                                                                  wait=True)

            print("register oracle for coinpar", cp, " result ", tx)


if __name__ == '__main__':
    helpers.run_main(main)
