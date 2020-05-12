from common import helpers
from common.services import blockchain
from common.services.oracle_manager_service import OracleManagerService
from oracle.src.oracle_service import OracleService
from scripts import script_settings

ORACLE_ACCOUNT = script_settings.SCRIPT_ORACLE_ACCOUNT
ORACLE_ADDR = str(ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)

oracle_manager_service = OracleManagerService()
oracle_service = OracleService(oracle_manager_service)


async def main():
    for cp in script_settings.USE_COIN_PAIR:
        balance = await blockchain.get_balance(script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)
        print(cp, " Oracle owner coinbase balance ", balance)
        if balance < script_settings.NEEDED_GAS:
            print(cp, " Oralce owner need at least %r but has %r" % (script_settings.NEEDED_GAS, balance))
            return

        # register oracle
        is_subscribed = await oracle_manager_service.is_subscribed(cp, ORACLE_ADDR)
        if is_subscribed:
            print(cp, " ORACLE IS SUBSCRIBED, CANT REMOVE")
            return

        cps = await oracle_service.get_coin_pair_service(cp)
        registered = await cps.get_oracle_round_info(ORACLE_ADDR)
        print(cp, " registered info", registered)

        round_info = await cps.get_round_info()
        print(cp, " round info", round_info)
        round_number = round_info.round

        num_idle_rounds = await cps.get_num_idle_rounds()
        if round_number - registered.selectedInCurrentRound < num_idle_rounds:
            print("must be idle for", num_idle_rounds, 'rounds and was only', round_number - registered.selectedInRound)
            return

        tx = await oracle_manager_service.remove_oracle(ORACLE_ADDR,
                                                        account=script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT,
                                                        wait=True)
        print("remove oracle", tx)


if __name__ == '__main__':
    helpers.run_main(main)
