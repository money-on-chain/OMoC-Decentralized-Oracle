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
    if available_mocs < script_settings.INITIAL_STAKE:
        tx = await moc_token_service.mint(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr, script_settings.INITIAL_STAKE,
                                          account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                          wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return

    print("STAKE BEFORE: ",
          await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))

    token_approved = await moc_token_service.allowance(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr,
                                                       supporters_service.SUPPORTERS_ADDR)
    print("tokenApproved", token_approved)
    if token_approved < script_settings.INITIAL_STAKE:
        tx = await moc_token_service.approve(supporters_service.SUPPORTERS_ADDR,
                                             script_settings.INITIAL_STAKE,
                                             account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                             wait=True)
        print("token approve", tx)

    tx = await supporters_service.add_stake(script_settings.INITIAL_STAKE,
                                            account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                            wait=True)
    if is_error(tx):
        print("ERROR IN APPROVE", tx)
        return
    print("STAKE AFTER: ", await supporters_service.detailed_balance_of(script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
