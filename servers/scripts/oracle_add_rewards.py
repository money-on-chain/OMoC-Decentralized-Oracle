from common import helpers
from common.services.blockchain import is_error
from scripts import script_settings


# Take from scheduler addr into reward bag addr
async def main():
    conf, oracle_service, moc_token_service, oracle_manager, oracle_manager_addr = await script_settings.configure_oracle()

    for cp in script_settings.USE_COIN_PAIR:
        cps = await oracle_service.get_coin_pair_service(cp)
        print(cp, " REWARDS BEFORE: ", await cps.get_available_reward_fees())

        balance = await script_settings.blockchain.get_balance(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr)
        if balance < script_settings.NEEDED_APROVE_BAG:
            tx = await moc_token_service.mint(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr,
                                              script_settings.NEEDED_APROVE_BAG,
                                              account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                              wait=True)
            if is_error(tx):
                print("ERROR IN MINT", tx)
                return

        tx = await moc_token_service.transfer(cps.addr, script_settings.REWARDS,
                                              account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                              wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return
        print(cp, " REWARDS AFTER: ", await cps.get_available_reward_fees())


if __name__ == '__main__':
    helpers.run_main(main)
