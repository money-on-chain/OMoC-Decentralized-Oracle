from common import helpers
from common.services import blockchain
from common.services.blockchain import is_error
from common.services.moc_token_service import MocTokenService
from common.services.oracle_manager_service import OracleManagerService
from oracle.src.oracle_service import OracleService
from scripts import script_settings
from scripts.script_settings import REWARDS, NEEDED_APROVE_BAG, SCHEDULER_ACCOUNT

REWARDS_ACCOUNT = SCHEDULER_ACCOUNT

oracle_manager_service = OracleManagerService()
oracle_service = OracleService(oracle_manager_service)
moc_token_service = MocTokenService()

# Take from scheduler addr into reward bag addr
async def main():
    for cp in script_settings.USE_COIN_PAIR:
        cps = await oracle_service.get_coin_pair_service(cp)
        print(cp, " REWARDS BEFORE: ", await cps.get_available_reward_fees())

        balance = await blockchain.get_balance(REWARDS_ACCOUNT.addr)
        if balance < NEEDED_APROVE_BAG:
            tx = await moc_token_service.mint(REWARDS_ACCOUNT.addr, NEEDED_APROVE_BAG,
                                              account=REWARDS_ACCOUNT,
                                              wait=True)
            if is_error(tx):
                print("ERROR IN MINT", tx)
                return

        tx = await moc_token_service.transfer(cps.addr, REWARDS,
                                              account=REWARDS_ACCOUNT,
                                              wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return
        print(cp, " REWARDS AFTER: ", await cps.get_available_reward_fees())


if __name__ == '__main__':
    helpers.run_main(main)
