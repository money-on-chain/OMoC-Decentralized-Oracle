from common import helpers
from common.services.blockchain import is_error
from common.services.moc_token_service import MocTokenService
from common.services.supporters_service import SupportersService
from scripts.script_settings import REWARDS, SCHEDULER_ACCOUNT

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT

supporters_service = SupportersService()
moc_token_service = MocTokenService()


# Take from scheduler addr into reward bag addr
async def main():
    available_mocs = await moc_token_service.balance_of(SCHEDULER_ACCOUNT.addr)
    print("AVAILABLE MOCS: ", available_mocs)
    if available_mocs < REWARDS:
        tx = await moc_token_service.mint(SCHEDULER_ACCOUNT.addr, REWARDS,
                                          account=REWARDS_ACCOUNT,
                                          wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return

    tx = await moc_token_service.transfer(supporters_service.SUPPORTERS_ADDR,
                                          REWARDS,
                                          account=SCHEDULER_ACCOUNT,
                                          wait=True)
    print("token transfer", tx)


if __name__ == '__main__':
    helpers.run_main(main)
