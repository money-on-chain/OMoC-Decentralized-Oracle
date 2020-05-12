import pytest
from starlette.datastructures import Secret

from common import crypto
from common.ganache_accounts import GANACHE_ACCOUNTS
from common.services.blockchain import BlockchainAccount
from common.services.oracle_dao import CoinPair, PriceWithTimestamp, \
    OracleRoundInfo
from oracle.src import oracle_settings
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfo
from oracle.src.oracle_configuration_loop import OracleTurnConfiguration
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_turn import OracleTurn
from oracle.src.request_validation import RequestValidation, ValidationFailure

conf = OracleTurnConfiguration(2, 0.05, 3, 1)
cp = CoinPair("BTCUSD")
price_ts_utc = 1

validated_by_is_oracle_turn = {
    "block_number": 123,
    "last_pub_block_hash": "",
    "blockchain_price": 12,
}
accounts = [BlockchainAccount(x[0], Secret(x[1])) for x in GANACHE_ACCOUNTS]

oracles = [
    OracleRoundInfo(accounts[3].addr, 'http://127.0.0.1:24004',
                    14000000000000000000,
                    '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True, 0),
    OracleRoundInfo(accounts[2].addr, 'http://127.0.0.1:24002',
                    8000000000000000000,
                    '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True, 0),
    OracleRoundInfo(accounts[7].addr, 'http://127.0.0.1:24000',
                    2000000000000000000,
                    '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True, 0)]


def rv(oracle_account):
    publish_price = 10
    exchange_price = 10
    publish_last_pub_block = 12
    blockchain_last_pub_block = 12
    version = 1
    oracle_price_reject_delta_pct = 0.05
    params = PublishPriceParams(version,
                                cp,
                                PriceWithTimestamp(publish_price, price_ts_utc),
                                oracle_account.addr,
                                publish_last_pub_block)
    return RequestValidation(oracle_price_reject_delta_pct,
                             params,
                             OracleTurn(conf, cp),
                             PriceWithTimestamp(exchange_price, price_ts_utc),
                             OracleBlockchainInfo(cp,
                                                  oracles,
                                                  validated_by_is_oracle_turn[
                                                      "blockchain_price"],
                                                  validated_by_is_oracle_turn[
                                                      "block_number"],
                                                  blockchain_last_pub_block,
                                                  last_pub_block_hash="0x000000"))


def sign(oracle_account, v: RequestValidation):
    message = v.params.prepare_price_msg()
    signature = crypto.sign_message(hexstr="0x" + message,
                                    account=oracle_account)
    return message, signature


def test_success():
    v = rv(accounts[3])
    msg, signature = sign(accounts[3], v)
    v.validate_signature(msg, signature)


def test_fail():
    v = rv(accounts[3])
    msg, signature = sign(accounts[0], v)
    with pytest.raises(ValidationFailure) as e:
        v.validate_signature(msg, signature)


def test_success_with_signature():
    v = rv(accounts[3])
    msg, signtr = sign(accounts[3], v)

    v.validate_params()
    v.validate_turn()
    v.validate_signature(msg, signtr)

    # this shouldn't throw
    message, signature = v.validate_and_sign(signtr)
    assert message == msg

    signature2 = crypto.sign_message(hexstr="0x" + msg,
                                     account=oracle_settings.get_oracle_account())
    assert signature == signature2
