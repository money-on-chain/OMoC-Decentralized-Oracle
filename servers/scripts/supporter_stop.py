from common import helpers
from common.services import supporters_service
from common.services.blockchain import is_error
from scripts.script_settings import SCHEDULER_ACCOUNT

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT


# Take from scheduler addr into reward bag addr
async def main():
    print("STAKE BEFORE: ", await supporters_service.detailed_balance_of(SCHEDULER_ACCOUNT.addr))

    tx = await supporters_service.stop(account=REWARDS_ACCOUNT, wait=True)
    if is_error(tx):
        print("ERROR IN APPROVE", tx)
        return
    
    print("STAKE AFTER: ", await supporters_service.detailed_balance_of(SCHEDULER_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
