import pytest

from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src import oracle_settings
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfo
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.request_validation import RequestValidation, ValidationFailure, \
    NoBlockchainData, DifferentLastPubBlock

cp = CoinPair("BTCUSD")
price_ts_utc = 1
# Checked elsewhere
oracle_turn = None
validated_by_is_oracle_turn = {
    "block_number": 123,
    "last_pub_block_hash": "",
    "blockchain_price": 12.12,
    "oracles": [],
    "oracle_addr": "0x1"
}


def rv(publish_price, exchange_price, publish_last_pub_block, blockchain_last_pub_block):
    version = 1
    oracle_price_reject_delta_pct = 0.05
    return RequestValidation(oracle_price_reject_delta_pct,
                             PublishPriceParams(version,
                                                cp,
                                                PriceWithTimestamp(publish_price,
                                                                   price_ts_utc),
                                                validated_by_is_oracle_turn[
                                                    "oracle_addr"],
                                                publish_last_pub_block),
                             oracle_turn,
                             PriceWithTimestamp(exchange_price, price_ts_utc),
                             OracleBlockchainInfo(cp,
                                                  validated_by_is_oracle_turn["oracles"],
                                                  validated_by_is_oracle_turn["blockchain_price"],
                                                  validated_by_is_oracle_turn["block_number"],
                                                  blockchain_last_pub_block,
                                                  validated_by_is_oracle_turn["last_pub_block_hash"]))

    def test_fail_if_no_exchange_price():
        with pytest.raises(NoBlockchainData) as e:
            rv(11.1, None, 10, 10).validate_params()
        assert "Still don't have a valid price" in str(e)

    def test_fail_if_no_publish_price():
        with pytest.raises(ValidationFailure) as e:
            rv(None, 11.1, 10, 10).validate_params()

    def test_fail_if_different_publication_blocks():
        with pytest.raises(DifferentLastPubBlock) as e:
            rv(11.1, 11.1, 19, 10).validate_params()

    def test_fail_if_price_changed_too_much():
        with pytest.raises(ValidationFailure) as e:
            rv(11.1, 11.1 * (1.0001 + oracle_settings.ORACLE_PRICE_REJECT_DELTA_PCT / 100),
               10, 10).validate_params()

    def test_success():
        rv(11.1, 11.1, 10, 10).validate_params()
        rv(11.1, 11.1 * (
                1 + oracle_settings.ORACLE_PRICE_REJECT_DELTA_PCT / 100),
           10, 10).validate_params()
