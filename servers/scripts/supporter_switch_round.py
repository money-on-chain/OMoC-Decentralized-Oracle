from common import helpers
from scripts import script_settings


# Take from scheduler addr into reward bag addr
async def main():
    conf, supporters_service, moc_token_service = await script_settings.configure_supporter()
    tx = await supporters_service.distribute(account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT, wait=True)
    print(tx)


if __name__ == '__main__':
    helpers.run_main(main)
