from random import randint

from common import crypto, helpers
from common.services.oracle_dao import PriceWithTimestamp
from common.services.oracle_manager_service import OracleManagerService
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_service import OracleService
from scripts import script_settings


async def main():
    oracle_account = script_settings.SCRIPT_ORACLE_ACCOUNT
    oracle_addr = str(script_settings.SCRIPT_ORACLE_ACCOUNT.addr)
    print("ORACLE ADDR", oracle_addr)
    print("ORACLE OWNER ADDR", script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)

    conf = await script_settings.configure()
    oracle_manager_service = OracleManagerService(conf.ORACLE_MANAGER_ADDR)
    oracle_service = OracleService(oracle_manager_service)

    for cp in script_settings.USE_COIN_PAIR:
        cps = await oracle_service.get_coin_pair_service(cp)
        print('PRICE PREV', await cps.get_price())
        print('INFO FOR ', oracle_account.addr, ' = ', await cps.get_oracle_round_info(oracle_account.addr))
        price = randint(0, 10 ** 20)
        last_block = await cps.get_last_pub_block()
        print('PRICE ', price, 'LAST PUBLISHED BLOCK ', last_block)

        params = PublishPriceParams(conf.MESSAGE_VERSION, cp,
                                    PriceWithTimestamp(price, 0), oracle_account.addr, last_block)
        message = params.prepare_price_msg()
        print("params", params)
        print("message", message)
        # sign myself locally, just testing
        signature = crypto.sign_message_hex(hexstr="0x" + message, account=oracle_account)
        print("sign result: ", signature)
        tx = await cps.publish_price(params.version,
                                     params.coin_pair,
                                     params.price,
                                     params.oracle_addr,
                                     params.last_pub_block,
                                     [signature], account=oracle_account, wait=True)
        print("publish price", tx)
        print('PRICE POST', await cps.get_price())


if __name__ == '__main__':
    helpers.run_main(main)
