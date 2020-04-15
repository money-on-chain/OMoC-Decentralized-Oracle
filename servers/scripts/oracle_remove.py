from common import helpers
from common.services import blockchain, oracle_manager_service
from oracle.src import oracle_settings, oracle_service
from scripts import script_settings
from scripts.script_settings import NEEDED_GAS, ORACLE_OWNER_ACCOUNT

ORACLE_ACCOUNT = oracle_settings.get_oracle_account()
ORACLE_ADDR = str(ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", ORACLE_OWNER_ACCOUNT.addr)


async def main():
    for cp in script_settings.USE_COIN_PAIR:
        balance = await blockchain.get_balance(ORACLE_OWNER_ACCOUNT.addr)
        print(cp, " Oracle owner coinbase balance ", balance)
        if balance < NEEDED_GAS:
            print(cp, " Oralce owner need at least %r but has %r" % (NEEDED_GAS, balance))
            return

        # register oracle
        is_subscribed = await oracle_manager_service.is_subscribed(cp, ORACLE_ADDR)
        if is_subscribed:
            print(cp, " ORACLE IS SUBSCRIBED, CANT REMOVE")
            return

        cps = await oracle_service.get_oracle_service(cp)
        registered = await cps.get_oracle_round_info(ORACLE_ADDR)
        print(cp, " registered info", registered)

        round_info = await cps.get_round_info()
        print(cp, " round info", round_info)
        round_number = round_info.round

        num_idle_rounds = await cps.get_num_idle_rounds()
        if round_number - registered.selectedInCurrentRound < num_idle_rounds:
            print("must be idle for", num_idle_rounds, 'rounds and was only', round_number - registered.selectedInRound)
            return

        tx = await oracle_manager_service.remove_oracle(ORACLE_ADDR, account=ORACLE_OWNER_ACCOUNT, wait=True)
        print("remove oracle", tx)


if __name__ == '__main__':
    helpers.run_main(main)
