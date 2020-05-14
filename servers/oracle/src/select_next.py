#
# The algorithm to determine the next publisher
#
# Logic is as follows:
#
# * Obtain the hash H of the block PRICE_BLOCK where the last valid price was published  H(PRICE_BLOCK)
# * Get the list L1 containing the approved Oracles.
# * Build a second list L2 from list L1 items, where each item index is calculated
#   from traversing the block-hash hexbytes modulo the list size.
#
#  e.g:  Let H be the hash starting with
#  d2 dc 23 3a b9 a8 25 ...
#
#  With 6 oracles in L1 = [A,B,C,D,E,F] with stakes[20,20,30,45,10,15]
#  To avoid repetitions, we choose without replacement.
#
# we choose to generate L2 with L1(i0..i5) where:
#                                                    L1 selection
#    i0 = HexBytes(H)[0] % 6 = 0xD2 % 6  =   0     (A)  BCDEF
#    i1 = HexBytes(H)[1] % 5 = 0xDC % 5  =   0     (B)  CDEF
#    i2 = HexBytes(H)[2] % 4 = 0x23 % 4  =   3     CDE(F)
#    i3 = HexBytes(H)[3] % 3 = 0x3A % 3  =   1     C(D)E
#    i4 = HexBytes(H)[4] % 2 = 0xB9 % 2  =   1     C(E)
#    i5 = HexBytes(H)[5] % 1 = 0xA8 % 1  =   0     (C)
#
#  So L2 = [A, B,F, D, E, C]
#
# * Select next publisher and fallback according to:
#
#   RNDSTAKE = H(PRICE_BLOCK) MOD TOTAL-STAKE
#       = 0xd2dc233ab9a82529a8e538a5fb873aa2f448be7a350893716909f3089bb53baa % 140
#       = 122
#
#   Choose oracle where RNDSTAKE is in "stake bucket":
#
#   A   0..19
#   B   20..39
#   F   40..54
#   D   55..99
#   E   100..109
#   C   110..139 <---- RNDSTAKE
#
# * Choose fallback to next in the list (A)
#

import logging
from typing import List

from hexbytes import HexBytes

from common.services.oracle_dao import OracleRoundInfo

logger = logging.getLogger("fastapi")


def select_next(stake_limit_multiplicator, last_block_hash: str, oracle_info_list: List[OracleRoundInfo]):
    if len(oracle_info_list) == 0:
        return []
    if len(oracle_info_list) > 32:
        raise Exception('Cant have more than 32 oracles, the hash is 32 bytes long')

    min_stake = min([int(o.stake) for o in oracle_info_list])

    def get_capped_stake(oi):
        return min(int(oi.stake), min_stake * stake_limit_multiplicator)

    l1 = oracle_info_list.copy()
    total_stake = 0
    l2 = []
    stake_buckets = []

    idx = 0
    last_range_limit = 0
    hb = HexBytes(last_block_hash)
    while len(l1) > 0:
        sel_index = hb[idx] % len(l1)
        oracle_item = l1.pop(sel_index)
        total_stake += get_capped_stake(oracle_item)
        l2.append(oracle_item)
        stake_buckets.append((oracle_item.internetName,
                              last_range_limit + get_capped_stake(oracle_item) - 1))
        last_range_limit += get_capped_stake(oracle_item)
        idx += 1

    # Select from L2 according to stake weight
    # rnd_stake = int(last_block_hash, 16) % total_stake
    # i've got hexbytes string in hash, so:
    last_block_hash = int(hb.hex(), 16)
    rnd_stake = last_block_hash % total_stake
    idx = 0
    while rnd_stake > stake_buckets[idx][1]:
        idx += 1
    return [l2[(idx + i) % len(l2)] for i in range(len(l2))]
