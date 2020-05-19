from common import helpers
from common.services.blockchain import is_error
from scripts import script_settings


# Take from scheduler addr into reward bag addr
async def main():
    conf, supporters_service, moc_token_service = await script_settings.configure_supporter()
    print("AVAILABLE MOCS BEFORE: ", await moc_token_service.balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))
    print("STAKE BEFORE: ",
          await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))

    tx = await supporters_service.withdraw(account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT, wait=True)
    if is_error(tx):
        print("ERROR IN WITHDRAW", tx)
        return

    print("AVAILABLE MOCS AFTER: ", await moc_token_service.balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))
    print("STAKE AFTER: ", await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
