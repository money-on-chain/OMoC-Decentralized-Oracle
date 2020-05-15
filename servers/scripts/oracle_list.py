from common import helpers

from common.services.blockchain import is_error
from common.services.moc_token_service import MocTokenService
from common.services.oracle_manager_service import OracleManagerService
from oracle.src.oracle_service import OracleService
from scripts import script_settings


async def main():
    conf = await script_settings.configure()
    oracle_manager_service = OracleManagerService(conf.ORACLE_MANAGER_ADDR)
    oracle_service = OracleService(oracle_manager_service)
    moc_token_service = MocTokenService(await oracle_service.get_token_addr())

    print('--------------------------------------------------------------------------------------------------')
    print("Min oracle owner stake", await oracle_manager_service.get_min_oracle_owner_stake())
    for cp in script_settings.USE_COIN_PAIR:
        print('--------------------------------------------------------------------------------------------------')
        print('=========== COIN PAIR:', cp)
        cps = await oracle_service.get_coin_pair_service(cp)
        print("Num Idle rounds", await cps.get_num_idle_rounds())
        print("Round lock period in blocks", await  cps.get_round_lock_period_in_blocks())
        print("Max oracles per round", await  cps.get_max_oracles_per_rounds())
        print("PRICE", await  cps.get_price())
        print("Available rewards", await  cps.get_available_reward_fees())

        selected = await cps.get_selected_oracles_info()
        print("SELECTED ORACLES")
        for o in selected:
            print("\t", o.oracle_addr)

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
