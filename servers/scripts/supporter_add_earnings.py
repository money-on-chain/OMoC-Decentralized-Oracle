from common import helpers
from common.services import moc_service, supporters_service
from common.services.blockchain import is_error
from scripts.script_settings import REWARDS, SCHEDULER_ACCOUNT

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT


# Take from scheduler addr into reward bag addr
async def main():
    available_mocs = await moc_service.balance_of(SCHEDULER_ACCOUNT.addr)
    print("AVAILABLE MOCS: ", available_mocs)
    if available_mocs < REWARDS:
        tx = await moc_service.mint(SCHEDULER_ACCOUNT.addr, REWARDS,
                                    account=REWARDS_ACCOUNT,
                                    wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return

    tx = await moc_service.transfer(supporters_service.SUPPORTERS_ADDR,
                                    REWARDS,
                                    account=SCHEDULER_ACCOUNT,
                                    wait=True)
    print("token transfer", tx)


if __name__ == '__main__':
    helpers.run_main(main)
