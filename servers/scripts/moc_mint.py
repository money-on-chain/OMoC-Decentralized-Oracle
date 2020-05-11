from common import helpers
from common.services.blockchain import is_error
from common.services.moc_token_service import MocTokenService
from scripts.script_settings import SCHEDULER_ACCOUNT, INITIAL_STAKE

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT

moc_token_service = MocTokenService()


# Take from scheduler addr into reward bag addr
async def main():
    print("AVAILABLE MOCS BEFORE: ", await moc_token_service.balance_of(SCHEDULER_ACCOUNT.addr))

    tx = await moc_token_service.mint(SCHEDULER_ACCOUNT.addr, INITIAL_STAKE,
                                      account=REWARDS_ACCOUNT,
                                      wait=True)
    if is_error(tx):
        print("ERROR IN APPROVE", tx)
        return

    print("AVAILABLE MOCS AFTER: ", await moc_token_service.balance_of(SCHEDULER_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
