from common import helpers
from common.services import oracle_manager_service
from oracle.src import oracle_settings
from scripts import script_settings
from scripts.script_settings import ORACLE_OWNER_ACCOUNT

ORACLE_ACCOUNT = oracle_settings.get_oracle_account()
ORACLE_ADDR = str(ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", ORACLE_OWNER_ACCOUNT.addr)


async def main():
    registered = await oracle_manager_service.is_oracle_registered(ORACLE_ADDR)
    if not registered:
        print("ORACLE NOT REGISTERED")
        return

    for cp in script_settings.USE_COIN_PAIR:
        is_subscribed = await oracle_manager_service.is_subscribed(cp, ORACLE_ADDR)
        print(cp, " IS SUBSCRIBED: ", is_subscribed)
        if is_subscribed:
            tx = await oracle_manager_service.unsubscribe_coin_pair(cp, ORACLE_ADDR,
                                                                    account=ORACLE_OWNER_ACCOUNT,
                                                                    wait=True)

            print("unsubscribe for coinpar", cp, " result ", tx)


if __name__ == '__main__':
    helpers.run_main(main)
