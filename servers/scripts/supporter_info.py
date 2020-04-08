from common import helpers
from common.services import moc_service, supporters_service, blockchain
from scripts.script_settings import SCHEDULER_ACCOUNT

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT


# Take from scheduler addr into reward bag addr
async def main():
    print("isReadyToDistribute: ", await supporters_service.is_ready_to_distribute())

    currentblock = await blockchain.get_last_block()
    print("current block: ", currentblock)

    print("BALANCE OF SCHEDULER_ACCOUNT: ", SCHEDULER_ACCOUNT.addr, " is ",
          await supporters_service.detailed_balance_of(SCHEDULER_ACCOUNT.addr))

    print("MOC BALANCE OF SCHEDULER_ACCOUNT: ", SCHEDULER_ACCOUNT.addr, " is ",
          await moc_service.balance_of(SCHEDULER_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
