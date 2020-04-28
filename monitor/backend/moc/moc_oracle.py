import datetime
import json
import logging
import os
import time

import blockchain


class Pair:
    def __init__(self, cp):
        self._cp = cp.replace(b'\x00', b'')
        self.cp = self._cp.decode("ascii")
        self.address = None
        self.netcp = self._cp + (b'\00' * (32 - len(self.cp)))

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

    def __init__(self, w3, mgr_addr):
        self.contracts = {}
        self.w3 = w3
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
        (points, selectedInRound, selectedInCurrentRound) = self.contracts[pair].functions \
            .getOracleRoundInfo(address).call()
        if not selectedInCurrentRound:
            return None
        return points


class OracleChecker:
    def __init__(self, dec_oracle_checker, addr):
        self.dec_oracle_checker = dec_oracle_checker
        self._selected = {}
        self.prev = {}
        self.addr = addr
        self.__lastpub = {}  # pair: (date, why=init|publish)
        for pair in self.pairs:
            self._selected[pair] = False
            self.update(pair, time.time(), "init")

    @property
    def pairs(self):
        for p in self.dec_oracle_checker.pairs.values():
            yield p.name

    async def fetch(self, now):
        cur = {}
        for pair in self.pairs:
            try:
                cur[pair] = await blockchain.arun(lambda: self.dec_oracle_checker.getPoints(pair, self.addr))
            except Exception as err:
                logging.error(f"Cannot retrieve oracle {self.addr} "
                              f"points. Error: %r" % err)

        for pair in self.pairs:
            prev = self.prev.get(pair)
            _cur = cur.get(pair)
            if _cur is None:
                # NOT SELECTED
                self._selected[pair] = False
                continue
            self._selected[pair] = True
            if prev is not None and _cur != 0 and prev != _cur:
                logging.info("UPDATE", time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now)),
                             self.addr, pair, prev, _cur)
                self.update(pair, now)
        self.prev = cur

    def update(self, pair, now, why="publish"):
        self.__lastpub[pair] = (now, why)

    def get_last_pub(self, pair):
        return self.__lastpub.get(pair)

    def get_selected(self, pair):
        return self._selected.get(pair)


class NoPubAlert:
    FormatPair = staticmethod(lambda pair: pair[:3] + "-" + pair[3:])
    FormatTime = staticmethod(lambda x: datetime.datetime.fromtimestamp(x))

    def __init__(self, checker, pair):
        # super(NoPubAlert, self).__init__(name="no-publication: %s" %
        #                                       self.FormatPair(pair), test=None,
        #                                       msg=None, action_required=False)
        self.checker = checker
        self.pair = pair
        self.name = "%s no-publication: %s" % (checker.addr, self.FormatPair(pair))
        self.action_required = False

    def test(self, ctx):
        if not self.checker.get_selected(self.pair):
            return False
        xxx = self.checker.get_last_pub(self.pair)
        return (ctx.now - xxx[0]) > ctx.cfg.getMaxNoPubPeriod()

    def msg(self, ctx):
        date, reason = self.checker.get_last_pub(self.pair)
        reason = "backend started" if reason == "init" else "last point was registered"
        date = self.FormatTime(date)
        pair = self.FormatPair(self.pair)
        return "%s No %s price publication: since %s at %s" % (self.checker.addr, pair, reason, date)

    def render(self, ctx):
        ua = "- User action is required!!!" if self.action_required else ""
        return "  *  %s %s" % (self.msg(ctx), ua)
