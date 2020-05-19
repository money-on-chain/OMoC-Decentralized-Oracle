import logging
import typing
from typing import List

from common.services.blockchain import BlockChainAddress

logger = logging.getLogger(__name__)


class CoinPair:
    def __init__(self, cp):
        self.cp = self.shorter(cp)

    def longer(self):
        return self.cp.encode("ascii").ljust(32, b'\0')

    @staticmethod
    def shorter(cp):
        while cp[-1] == "\x00":
            cp = cp[:-1]
        return cp

    def __str__(self):
        return self.cp

    def __repr__(self):
        return self.__str__()


PriceWithTimestamp = typing.NamedTuple('PriceWithTimestamp', [('price', int), ('ts_utc', int)])

CoinPairInfo = typing.NamedTuple("CoinPairInfo",
                                 [("coin_pair", CoinPair),
                                  ('addr', BlockChainAddress)])

OracleRegistrationInfo = typing.NamedTuple("OracleRegistrationInfo",
                                           [("addr", str),
                                            ('internetName', str),
                                            ("stake", int),
                                            ("owner", str)])

OracleRoundInfo = typing.NamedTuple("OracleRoundInfo",
                                    [("points", int),
                                     ("selectedInCurrentRound", bool),
                                     ("selectedInRound", int)
                                     ])

RoundInfo = typing.NamedTuple("RoundInfo", [('round', int),
                                            ("startBlock", int),
                                            ("lockPeriodEndBlock", int),
                                            ("totalPoints", int),
                                            ("selectedOracles", List[str])])
