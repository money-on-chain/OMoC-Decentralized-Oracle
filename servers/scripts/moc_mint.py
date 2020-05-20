from common import helpers
from common.services.blockchain import is_error
from scripts import script_settings


async def mint(moc_token_service, addr):
    print(addr, "AVAILABLE MOCS BEFORE: ",
          await moc_token_service.balance_of(addr))

    tx = await moc_token_service.mint(addr,
                                      script_settings.INITIAL_STAKE,
                                      account=script_settings.SCRIPT_REWARD_BAG_ACCOUNT,
                                      wait=True)
    if is_error(tx):
        print(addr, "ERROR IN MINT", tx)
        return

    print(addr, "AVAILABLE MOCS AFTER: ", await moc_token_service.balance_of(addr))
    print()


# Take from scheduler addr into reward bag addr
async def main():
    conf, oracle_service, moc_token_service, oracle_manager_service, oracle_manager_addr = await script_settings.configure_oracle()
    await mint(moc_token_service, script_settings.SCRIPT_ORACLE_ACCOUNT.addr)
    await mint(moc_token_service, script_settings.SCRIPT_REWARD_BAG_ACCOUNT.addr)


if __name__ == '__main__':
    helpers.run_main(main)
