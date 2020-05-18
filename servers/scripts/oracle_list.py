from common import helpers

from common.services.blockchain import is_error
from scripts import script_settings


async def main():
    conf, oracle_service, moc_token_service, oracle_manager_service, oracle_manager_addr = await script_settings.configure_oracle()

    print('--------------------------------------------------------------------------------------------------')
    print("Min oracle owner stake", await oracle_manager_service.get_min_oracle_owner_stake())
    for cp in script_settings.USE_COIN_PAIR:
        print('--------------------------------------------------------------------------------------------------')
        print('=========== COIN PAIR:', cp)
        cps = await oracle_service.get_coin_pair_service(cp)
        print("Num Idle rounds", await cps.get_num_idle_rounds())
        print("Round lock period in blocks", await cps.get_round_lock_period_in_blocks())
        print("Max oracles per round", await cps.get_max_oracles_per_rounds())
        print("PRICE", await  cps.get_price())
        print("Available rewards", await cps.get_available_reward_fees())

        selected = await cps.get_selected_oracles_info()
        print("SELECTED ORACLES")
        for o in selected:
            print("\t", o.addr)

        oracles = await oracle_service.get_all_oracles_info()
        if is_error(oracles):
            print(' ERROR', oracles)
            return
        print("ALL ORACLES")
        for o in oracles:
            print('\t', o)
            print('\t\tname', oracles[o].internetName, '\tbalance in mocs',
                  await moc_token_service.balance_of(oracles[o].owner))
            print('\t\tstake', oracles[o].stake, '\towner', oracles[o].owner)
            round_info = await cps.get_oracle_round_info(o)
            print("\t\tselectedInCurrentRound", round_info.selectedInCurrentRound,
                  "\tpoints", round_info.points)
            print("\t\tIS SUBSCRIBED", await oracle_manager_service.is_subscribed(cp, o))


if __name__ == '__main__':
    helpers.run_main(main)
