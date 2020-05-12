from common import helpers
from common.services.supporters_service import SupportersService
from scripts import script_settings

supporters_service = SupportersService()


# Take from scheduler addr into reward bag addr
async def main():
    tx = await supporters_service.distribute(account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT, wait=True)
    print(tx)


if __name__ == '__main__':
    helpers.run_main(main)
