import pytest
from starlette.datastructures import Secret

from common.ganache_accounts import GANACHE_ACCOUNTS
from common.services.blockchain import BlockchainAccount
from common.services.oracle_dao import CoinPair, PriceWithTimestamp, FullOracleRoundInfo
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfo
from oracle.src.oracle_configuration import OracleTurnConfiguration
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_turn import OracleTurn
from oracle.src.request_validation import RequestValidation, InvalidTurn

conf = OracleTurnConfiguration(2, 0.05, 3, 1)
cp = CoinPair("BTCUSD")
price_ts_utc = 1
version = 1

accounts = [BlockchainAccount(x[0], Secret(x[1])) for x in GANACHE_ACCOUNTS]

selected_oracles = [
    (accounts[3], 'http://127.0.0.1:24001', 14000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True,
     0),
    (accounts[4], 'http://127.0.0.1:24002', 8000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True,
     0),
    (accounts[5], 'http://127.0.0.1:24003', 2000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True,
     0),
    (accounts[6], 'http://127.0.0.1:24004', 8000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, True,
     0)]


def rv(oracle_turn, running_oracle, params):
    publish_price = 124123
    # Validated elsewhere
    publish_last_pub_block = 3231213
    blockchain_price = 1023
    oracle_price_reject_delta_pct = 0.05
    exchange_price = blockchain_price * params["price_delta"]
    return RequestValidation(oracle_price_reject_delta_pct,
                             PublishPriceParams(version,
                                                cp,
                                                PriceWithTimestamp(publish_price, price_ts_utc),
                                                running_oracle[0].addr,
                                                publish_last_pub_block),
                             oracle_turn,
                             PriceWithTimestamp(exchange_price, price_ts_utc),
                             OracleBlockchainInfo(cp,
                                                  [FullOracleRoundInfo(x[0].addr, *x[1:]) for x in selected_oracles],
                                                  blockchain_price,
                                                  params["block_number"],
                                                  params["blockchain_last_pub_block"],
                                                  params["last_pub_block_hash"]))


def can_publish(ot, params, is_idx):
    for i in is_idx:
        v = rv(ot, selected_oracles[i], params)
        v.validate_turn()
    is_not_idx = [x for x in range(4) if x not in is_idx]
    for i in is_not_idx:
        v = rv(ot, selected_oracles[i], params)
        with pytest.raises(InvalidTurn) as e:
            v.validate_turn()


def test_success_oracle_turn():
    # This class monitors the publication block an the price change block
    # if we don't change any of those the internal state doesn't change
    ot = OracleTurn(conf, cp)
    params = {
        "block_number": 1,
        "price_delta": 1,
        "blockchain_last_pub_block": 10,
        "last_pub_block_hash": "0x00000000"}

    # Account zero is not in selected group
    v = rv(ot, (accounts[0],), params)
    with pytest.raises(InvalidTurn) as e:
        v.validate_turn()

    # selected_oracles 0 is selected, selected_oracles 1, 2 and 3 aren't
    can_publish(ot, params, [0])

    params["last_pub_block_hash"] = "0x01000000"
    # for a different block hash the chosen one changes
    can_publish(ot, params, [1])

    # After a price change the fallback start will publish, but after some blocks
    params["price_delta"] = 1.000000001 + conf.price_fallback_delta_pct / 100
    can_publish(ot, params, [1])
    params["block_number"] = params["block_number"] + conf.price_fallback_blocks - 1
    can_publish(ot, params, [1])
    # after some block then the primary fallbacks can
    params["block_number"] = params["block_number"] + conf.price_fallback_blocks
    can_publish(ot, params, [1, 0])

    # After some more blocks the secondary can
    params["block_number"] = params["block_number"] + conf.price_fallback_blocks
    can_publish(ot, params, [1, 0, 2])

    # After some more blocks everybody can publish
    params["block_number"] = params["block_number"] + conf.price_fallback_blocks
    can_publish(ot, params, [1, 0, 2, 3])


def test_fail_if_invalid_price():
    # This class monitors the publication block an the price change block
    # if we don't change any of those the internal state doesn't change
    ot = OracleTurn(conf, cp)
    params = {
        "block_number": 1,
        "price_delta": 1,
        "blockchain_last_pub_block": 10,
        "last_pub_block_hash": "0x00000000"}
    can_publish(ot, params, [0])
    params["blockchain_price"] = 12
    can_publish(ot, params, [0])
