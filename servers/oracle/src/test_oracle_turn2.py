from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfo
from oracle.src.oracle_coin_pair_service import FullOracleRoundInfo
from oracle.src.oracle_configuration_loop import OracleTurnConfiguration
from oracle.src.oracle_turn import OracleTurn

conf = OracleTurnConfiguration(2, 0.05, 3, 1)

points = 0
current_round_num = 10
selected_oracles = [
    FullOracleRoundInfo('0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d', 'http://127.0.0.1:24004',
                        14000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', points, True,
                        current_round_num),
    FullOracleRoundInfo('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', 'http://127.0.0.1:24002',
                        8000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', points, True,
                        current_round_num),
    FullOracleRoundInfo('0x28a8746e75304c0780E011BEd21C72cD78cd535E', 'http://127.0.0.1:24000',
                        2000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', points, True,
                        current_round_num),
    FullOracleRoundInfo('0x28a8746e75304c0780E011BEd21C72cD78cd535E', 'http://127.0.0.1:24000',
                        2000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', points, False,
                        current_round_num)]


def g(last_pub_block, block_num, blockchain_price):
    return OracleBlockchainInfo("BTCUSD", [], blockchain_price, block_num, last_pub_block, "")


gg = PriceWithTimestamp


def h(os, block_num, last_pub_block, last_pub_block_hash, blockchain_price):
    return OracleBlockchainInfo(CoinPair('BTCUSD'), os, blockchain_price, block_num, last_pub_block,
                                last_pub_block_hash)


def test_is_never_oracle_3_turn_is_not_selected():
    f = OracleTurn(conf, "BTCUSD")

    assert f.is_oracle_turn(h(selected_oracles, 18, 1, "0x00000000",
                              11.1 + conf.price_fallback_delta_pct * .99),
                            selected_oracles[3].addr, gg(11.1, 0)) is False


def test_is_oracle_turn_no_price_change():
    f = OracleTurn(conf, "BTCUSD")

    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000000", 11.1), selected_oracles[0].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000000", 11.1), selected_oracles[1].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 14, 1, "0x00000000", 11.1), selected_oracles[0].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 14, 1, "0x00000000", 11.1), selected_oracles[1].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 16, 1, "0x00000000", 11.1), selected_oracles[0].addr,
                            gg(11.1 + conf.price_fallback_delta_pct * .99, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 16, 1, "0x00000000", 11.1), selected_oracles[1].addr,
                            gg(11.1 + conf.price_fallback_delta_pct * .99, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 18, 1, "0x00000000",
                              11.1 + conf.price_fallback_delta_pct * .99),
                            selected_oracles[0].addr, gg(11.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 18, 1, "0x00000000",
                              11.1 + conf.price_fallback_delta_pct * .99),
                            selected_oracles[0].addr, gg(11.1, 0)) is True


def test_is_oracle_turn_price_change():
    f = OracleTurn(conf, "BTCUSD")

    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[0].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[1].addr,
                            gg(11.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[2].addr,
                            gg(11.1, 0)) is False

    # price change
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[0].addr,
                            gg(14.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[1].addr,
                            gg(14.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 12, 1, "0x00000001", 11.1), selected_oracles[2].addr,
                            gg(14.1, 0)) is False

    assert f.is_oracle_turn(h(selected_oracles, 13, 1, "0x00000001", 11.1), selected_oracles[0].addr,
                            gg(14.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 13, 1, "0x00000001", 11.1), selected_oracles[1].addr,
                            gg(14.1, 0)) is False
    assert f.is_oracle_turn(h(selected_oracles, 13, 1, "0x00000001", 11.1), selected_oracles[2].addr,
                            gg(14.1, 0)) is False

    assert f.is_oracle_turn(h(selected_oracles, 13 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[0].addr, gg(14.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 13 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[1].addr, gg(11.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 13 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[2].addr, gg(11.1, 0)) is False

    assert f.is_oracle_turn(h(selected_oracles, 14 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[0].addr, gg(14.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 14 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[1].addr, gg(11.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 14 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[2].addr, gg(11.1, 0)) is False

    assert f.is_oracle_turn(h(selected_oracles, 16 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[0].addr, gg(14.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 16 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[1].addr, gg(11.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 16 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[2].addr, gg(11.1, 0)) is True

    assert f.is_oracle_turn(h(selected_oracles, 18 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[0].addr, gg(14.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 18 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[1].addr, gg(11.1, 0)) is True
    assert f.is_oracle_turn(h(selected_oracles, 18 + conf.price_fallback_blocks, 1,
                              "0x00000001", 11.1), selected_oracles[2].addr, gg(11.1, 0)) is True
