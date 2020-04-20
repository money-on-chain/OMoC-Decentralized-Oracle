import json
import logging
import os
import time

import blockchain
from config import Config


class Pair:
    def __init__(self, cp):
        self._cp = cp.replace(b'\x00', b'')
        self.cp = self._cp.decode("ascii")
        self.address = None
        self.netcp = self._cp + (b'\00'*(32-len(self.cp)))

    @property
    def name(self):
        return self.cp

    @property
    def net(self):
        return self.netcp

    def set_address(self, addr):
        self.address = addr

    def __str__(self):
        return '-%s@%s' % (self.cp, self.address)

    __repr__ = lambda self, *args: str(self)


class DecOracleCheker:
    CPP = os.path.join("moc", "CoinPairPrice.json")
    MGR = os.path.join("moc", "OracleManager.json")

    @staticmethod
    def getABI(filename):
        with open(filename) as jfile:
            return json.load(jfile)["abi"]

    def __init__(self, mgr_addr):
        self.contracts = {}
        self.cfg = cfg = Config.Get()
        self.w3 = w3 = cfg.getW3()
        self.mgr_addr = mgr_addr
        self.mgr = w3.eth.contract(address=mgr_addr, abi=self.getABI(self.MGR))
        self.pairs = self.init()

    def init(self):
        pairs = {}
        pairs_cnt = self.mgr.functions.getCoinPairCount().call()
        while len(pairs) < pairs_cnt:
            cp = Pair(self.mgr.functions.getCoinPairAtIndex(len(pairs)).call())
            cp.set_address(self.mgr.functions.getContractAddress(cp.net).call())
            pairs[cp.name] = cp

        for pair in pairs.values():
            contract = self.w3.eth.contract(address=pair.address,
                                            abi=self.getABI(self.CPP))
            self.contracts[pair.name] = contract
        return pairs

    def getPoints(self, pair, address):
        points, _, _ = self.contracts[pair].functions.getOracleRoundInfo(
                                                                address).call()
        return points


class AccountsChecker:
    def __init__(self, cfg):
        self.doc = DecOracleCheker(cfg.getOracleManagerAddress())
        self.prev = {}
        self.pairs_to_check = cfg.getPairs()
        self.oracle_addr = cfg.getOracleAddress()
        self.__lastpub = {}  # pair: (date, why=init|publish)
        for pair in self.pairs_to_check:
            self.update(pair, "init")

    @property
    def pairs(self):
        for p in self.doc.pairs.values():
            yield p.name

    async def fetch(self):
        cur = {}
        for pair in self.pairs_to_check:
            try:
                cur[pair] = await blockchain.arun(lambda: self.doc.getPoints(
                                                        pair, self.oracle_addr))
            except Exception as err:
                logging.error(f"Cannot retrieve oracle ${self.oracle_addr} "
                              f"points. Error: %r" % err)

        for pair in self.pairs_to_check:
            prev = self.prev.get(pair)
            _cur = cur.get(pair)
            if not(prev is None):
                if (prev != _cur) and (_cur != 0):
                    self.update(pair)
        self.prev = cur

    def update(self, pair, why="publish"):
        self.__lastpub[pair] = (time.time(), why)

    def getLastPub(self, pair):
        return self.__lastpub.get(pair)


class NoPubAlert:
    FormatPair = staticmethod(lambda pair: pair[:3] + "-" + pair[3:])
    FormatTime = staticmethod(lambda x: time.strftime("%Y-%m-%d %H:%M:%S",
                                                      time.gmtime(x)))

    def __init__(self, pair):
        # super(NoPubAlert, self).__init__(name="no-publication: %s" %
        #                                       self.FormatPair(pair), test=None,
        #                                       msg=None, action_required=False)
        self.pair = pair
        self.name = "no-publication: %s" % self.FormatPair(pair)
        self.action_required = False

    def test(self, ctx):
        xxx = ctx.DocAC.getLastPub(self.pair)
        return ((ctx.now - xxx[0]) >
                ctx.cfg.getMaxNoPubPeriod())

    def msg(self, ctx):
        date, reason = ctx.DocAC.getLastPub(self.pair)
        reason = "backend started" if reason=="init" else "last point was registered"
        date = self.FormatTime(date)
        pair = self.FormatPair(self.pair)
        return "No %s price publication: since %s at %s" % (pair, reason, date)

    def render(self, ctx):
        ua = "- User action is required!!!" if self.action_required else ""
        return "  *  %s %s" % (self.msg(ctx), ua)
