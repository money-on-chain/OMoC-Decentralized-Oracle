from common import helpers
from common.services.blockchain import is_error
from common.services.supporters_service import SupportersService
from scripts import script_settings


# Take from scheduler addr into reward bag addr
async def main():
    conf = await script_settings.configure()
    supporters_service = SupportersService(conf.SUPPORTERS_VESTED_ADDR)
    print("STAKE BEFORE: ",
          await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))

    tx = await supporters_service.stop(account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT, wait=True)
    if is_error(tx):
        print("ERROR IN APPROVE", tx)
        return

    print("STAKE AFTER: ", await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
