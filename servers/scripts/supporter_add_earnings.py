from common import helpers
from common.services.blockchain import is_error
from common.services.moc_token_service import MocTokenService
from common.services.supporters_service import SupportersService
from scripts import script_settings

supporters_service = SupportersService()
moc_token_service = MocTokenService()


# Take from scheduler addr into reward bag addr
async def main():
    available_mocs = await moc_token_service.balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr)
    print("AVAILABLE MOCS: ", available_mocs)
    if available_mocs < script_settings.REWARDS:
        tx = await moc_token_service.mint(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr, script_settings.REWARDS,
                                          account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                          wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return

    tx = await moc_token_service.transfer(supporters_service.SUPPORTERS_ADDR,
                                          script_settings.REWARDS,
                                          account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                          wait=True)
    print("token transfer", tx)


if __name__ == '__main__':
    helpers.run_main(main)
