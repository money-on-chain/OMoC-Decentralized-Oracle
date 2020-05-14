from common import helpers
from common.services import blockchain
from common.services.moc_token_service import MocTokenService
from common.services.supporters_service import SupportersService
from scripts import script_settings

REWARDS_ACCOUNT = script_settings.SCRIPT_REWARD_BAG_ACCOUNT

supporters_service = SupportersService()
moc_token_service = MocTokenService()


# Take from scheduler addr into reward bag addr
async def main():
    print("isReadyToDistribute: ", await supporters_service.is_ready_to_distribute())

    currentblock = await blockchain.get_last_block()
    print("current block: ", currentblock)

    print("BALANCE OF SCHEDULER_ACCOUNT: ", script_settings.SCRIPT_ORACLE_ACCOUNT.addr, " is ",
          await supporters_service.detailed_balance_of(script_settings.SCRIPT_ORACLE_ACCOUNT.addr))

    print("MOC BALANCE OF SCHEDULER_ACCOUNT: ", script_settings.SCRIPT_ORACLE_ACCOUNT.addr, " is ",
          await moc_token_service.balance_of(script_settings.SCRIPT_ORACLE_ACCOUNT.addr))


if __name__ == '__main__':
    helpers.run_main(main)
