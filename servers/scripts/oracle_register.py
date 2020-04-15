from common import helpers
from common.services import blockchain, moc_service, oracle_manager_service
from common.services.blockchain import is_error
from oracle.src import oracle_settings
from scripts.script_settings import INITIAL_STAKE, SCHEDULER_ACCOUNT, NEEDED_GAS, ORACLE_OWNER_ACCOUNT

ORACLE_ACCOUNT = oracle_settings.get_oracle_account()
ORACLE_ADDR = str(ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", ORACLE_OWNER_ACCOUNT.addr)


async def main():
    balance = await blockchain.get_balance(ORACLE_OWNER_ACCOUNT.addr)
    print("Oracle owner coinbase balance ", balance)
    if balance < NEEDED_GAS:
        print("Oralce owner need at least %r but has %r" % (NEEDED_GAS, balance))
        return

    moc_balance = await moc_service.balance_of(ORACLE_OWNER_ACCOUNT.addr)
    print("Oracle owner moc balance ", moc_balance)
    if moc_balance < INITIAL_STAKE * 2:
        tx = await moc_service.mint(ORACLE_OWNER_ACCOUNT.addr, INITIAL_STAKE * 2,
                                    account=ORACLE_OWNER_ACCOUNT,
                                    wait=True)
        if is_error(tx):
            print("ERROR IN APPROVE", tx)
            return

    # move some rsks to my account
    balance = await blockchain.get_balance(ORACLE_ADDR)
    print("price fetcher coinbase balance", balance)
    if balance < NEEDED_GAS:
        tx = await blockchain.bc_transfer(ORACLE_ADDR,
                                          NEEDED_GAS,
                                          account=SCHEDULER_ACCOUNT,
                                          wait=True)
        print("rbtc transfer", tx)

    # register oracle
    registered = await oracle_manager_service.get_oracle_registration_info(ORACLE_ADDR)
    if blockchain.is_error(registered):
        # aprove moc movement
        token_approved = await moc_service.allowance(ORACLE_OWNER_ACCOUNT.addr,
                                                     oracle_manager_service.ORACLE_MANAGER_ADDR)
        print("tokenApproved", token_approved)
        if token_approved < INITIAL_STAKE:
            tx = await moc_service.approve(oracle_manager_service.ORACLE_MANAGER_ADDR,
                                           INITIAL_STAKE,
                                           account=ORACLE_OWNER_ACCOUNT,
                                           wait=True)
            print("token approve", tx)

        tx = await oracle_manager_service.register_oracle(ORACLE_ADDR, "http://localhost:5556", INITIAL_STAKE,
                                                          account=ORACLE_OWNER_ACCOUNT,
                                                          wait=True)
        print("register oracle is ok to fail", tx)

    registered = await oracle_manager_service.get_oracle_registration_info(ORACLE_ADDR)
    if registered.stake:
        print("ORACLE ALLREADY APPROVED, WE ARE DONE")
        return


if __name__ == '__main__':
    helpers.run_main(main)
