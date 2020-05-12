import secrets
from random import randint

from common.services.oracle_dao import OracleRoundInfo
from oracle.src.select_next import select_next

stake_limit_multiplicator = 2


def test_next_publisher_loop():
    num_oracles = 32
    num_rounds = 12000

    oracle_infos = []

    total_stake = 0
    for i in range(0, num_oracles):
        stake = randint(0, 1000) + 10000
        total_stake += stake
        oi = OracleRoundInfo(secrets.token_hex(nbytes=20), 'SOME_NAME', stake,
                             '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, False, 0)
        oracle_infos.append(oi)

    # prev_stats = [(o["addr"], o["stake"], o["stake"] / total_stake) for o in
    #              sorted(oracle_infos, key=lambda y: y["ownerStake"])]

    # print("\n".join([("%r %r %r" % x) for x in prev_stats]))

    stats = {o.addr: 0 for o in oracle_infos}
    rounds = 0
    for i in range(num_rounds):
        last_block_hash = secrets.token_hex(nbytes=32)
        s = select_next(stake_limit_multiplicator, last_block_hash, oracle_infos)
        s_addr = s[0].addr
        stats[s_addr] = stats[s_addr] + 1
        rounds += 1

    post_stats = [(o.addr, o.stake, o.stake / total_stake, stats[o.addr] / rounds) for o in
                  sorted(oracle_infos, key=lambda y: y.stake)]
    # print("\n".join([("%r %r %r %r" % x) for x in post_stats]))

    # En num_rounds tenemos un 10% de desviacion.
    for o in post_stats:
        assert abs(o[2] - o[3]) / (o[2] + o[3]) < 1 / 10


def test_should_support_an_empty_list():
    oracle_info_list = []
    last_block_hash = "0x000000"
    s = select_next(stake_limit_multiplicator, last_block_hash, oracle_info_list)
    assert s == oracle_info_list


def test_select_next():
    oracle_info_list = [
        OracleRoundInfo('0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d', 'http://127.0.0.1:24004',
                        14000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, False, 0),
        OracleRoundInfo('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', 'http://127.0.0.1:24002',
                        8000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, False, 0),
        OracleRoundInfo('0x28a8746e75304c0780E011BEd21C72cD78cd535E', 'http://127.0.0.1:24000',
                        2000000000000000000, '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, False, 0)]

    last_block_hash = "0x000000"
    s = select_next(stake_limit_multiplicator, last_block_hash, oracle_info_list)
    assert s == [oracle_info_list[0], oracle_info_list[1], oracle_info_list[2]]

    last_block_hash = "0x010000"
    s = select_next(stake_limit_multiplicator, last_block_hash, oracle_info_list)
    assert s == [oracle_info_list[1], oracle_info_list[0], oracle_info_list[2]]

    last_block_hash = "0x000100"
    s = select_next(stake_limit_multiplicator, last_block_hash, oracle_info_list)
    assert s == [oracle_info_list[0], oracle_info_list[2], oracle_info_list[1]]

    last_block_hash = "0x000001"
    s = select_next(stake_limit_multiplicator, last_block_hash, oracle_info_list)
    assert s == [oracle_info_list[0], oracle_info_list[1], oracle_info_list[2]]


def test_check_stake_limit():
    NUM_ORACLES = 32
    NUM_ROUNDS = 12000
    MIN_STAKE = 10
    oracle_infos = []
    total_stake = 0
    for i in range(0, NUM_ORACLES):
        stake = 10000 + i * 100000 if not i == 0 else MIN_STAKE
        total_stake += stake
        oi = OracleRoundInfo(secrets.token_hex(nbytes=20), 'SOME_NAME', stake,
                             '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826', 0, False, 0)
        oracle_infos.append(oi)

    stats = {o.addr: 0 for o in oracle_infos}
    rounds = 0
    for i in range(NUM_ROUNDS):
        last_block_hash = secrets.token_hex(nbytes=32)
        s = select_next(stake_limit_multiplicator, last_block_hash, oracle_infos)
        s_addr = s[0].addr
        stats[s_addr] = stats[s_addr] + 1
        rounds += 1
    PROB = 1 / NUM_ORACLES
    post_stats = [(o.addr, o.stake, PROB, stats[o.addr] / rounds) for o in
                  sorted(oracle_infos, key=lambda y: y.stake)]
    # print("\n".join([("%r %r %r %r" % x) for x in post_stats]))
    # En num_rounds tenemos un 10% de desviacion.
    for o in post_stats:
        delta = abs(o[2] - o[3])
        assert delta < 1 / 10
