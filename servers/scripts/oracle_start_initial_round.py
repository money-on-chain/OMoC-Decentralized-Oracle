from common import helpers
from common.services.blockchain import is_error
from scripts import script_settings


async def main():
    conf, oracle_service, moc_token_service, oracle_manager_service = await script_settings.configure_oracle()

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
