from random import randint

from common import crypto, helpers
from common.services.ethernal_storage_service import EternalStorageService
from common.services.oracle_dao import PriceWithTimestamp
from common.services.oracle_manager_service import OracleManagerService
from oracle.src import oracle_settings
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_service import OracleService
from scripts import script_settings

ORACLE_ACCOUNT = script_settings.SCRIPT_ORACLE_ACCOUNT
ORACLE_ADDR = str(script_settings.SCRIPT_ORACLE_ACCOUNT.addr)
print("ORACLE ADDR", ORACLE_ADDR)
print("ORACLE OWNER ADDR", script_settings.SCRIPT_ORACLE_OWNER_ACCOUNT.addr)

oracle_manager_service = OracleManagerService()
oracle_service = OracleService(oracle_manager_service)
storage_service = EternalStorageService()
oracle_config = OracleConfigurationLoop(storage_service)


async def main():
    for cp in script_settings.USE_COIN_PAIR:
        cps = await oracle_service.get_coin_pair_service(cp)
        print('PRICE PREV', await cps.get_price())
        print('INFO FOR ', ORACLE_ACCOUNT.addr, ' = ', await cps.get_oracle_round_info(ORACLE_ACCOUNT.addr))
        price = randint(0, 10 ** 20)
        last_block = await cps.get_last_pub_block()
        print('PRICE ', price, 'LAST PUBLISHED BLOCK ', last_block)

        params = PublishPriceParams(oracle_config.MESSAGE_VERSION, cp,
                                    PriceWithTimestamp(price, 0), ORACLE_ACCOUNT.addr, last_block)
        message = params.prepare_price_msg()
        print("params", params)
        print("message", message)
        # sign myself locally, just testing
        signature = crypto.sign_message_hex(hexstr="0x" + message, account=ORACLE_ACCOUNT)
        print("sign result: ", signature)
        tx = await cps.publish_price(params.version,
                                     params.coin_pair,
                                     params.price,
                                     params.oracle_addr,
                                     params.last_pub_block,
                                     [signature], account=ORACLE_ACCOUNT, wait=True)
        print("publish price", tx)
        print('PRICE POST', await cps.get_price())


if __name__ == '__main__':
    helpers.run_main(main)
