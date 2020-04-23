import asyncio
import logging
import time
from xmlrpc.client import ServerProxy

from config import Config
from moc.moc_oracle import AccountsChecker


async def arun(f):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, f)


class AWeb3:
    def __init__(self):
        self.w3 = Config.Get().getW3()

    async def getBlock(self, which="latest"):
        return await arun(lambda: self.w3.eth.getBlock(which))

    async def getBalance(self, account, block=None):
        return await arun(lambda: self.w3.eth.getBalance(account, block))


class Info:
    _Instance = None

    @classmethod
    def Get(cls):
        if cls._Instance is None:
            cls._Instance = Info()
        return cls._Instance

    def __init__(self):
        self.cfg = config = Config.Get()
        self.state = {}
        self.aw3 = AWeb3()
        self.netid = str(config.getBCNetId())
        self.lastblock = None
        self.accounts = config.getAccountList()
        self.oracle_manager_addr = config.getOracleManagerAddress()
        self.accountData = {}
        for account in self.accounts:
            addr = config.getAccountAddress(account)
            self.accountData[account] = {"addr": addr,
                                         "checker": AccountsChecker(self.oracle_manager_addr, addr)}
        self.agent = config.getAgentProgram()

    async def checkBlock(self):
        curblock = await self.aw3.getBlock()
        update = self.lastblock != curblock
        if update:
            self.lastblock = curblock
        return update

    async def fetch(self):
        self.state["now"] = time.time()
        for account in self.accounts:
            data = self.accountData[account]
            try:
                self.state[account] = await self.aw3.getBalance(data["addr"])
            except Exception as err:
                logging.error(f"Cannot retrieve account ${account} balance. "
                              f"Error: %r" % err)
            await data["checker"].fetch()
        self.state["blocknr"] = self.lastblock.number
        self.state["alive"] = self.getAgentAlive()

    @property
    def now(self):
        return self.state["now"]

    def balanceOf(self, account):
        return self.state[account]

    @property
    def agentAlive(self):
        return self.state["alive"]

    def getAgentAlive(self):
        try:
            try:
                server = ServerProxy('http://localhost:9001/RPC2')
            except Exception as e:
                logging.debug("Supervisor connection error: " + str(e))
                raise
            m = {True: "yes", False: "no"}
            running = server.supervisor.getProcessInfo(
                self.agent)["statename"] == "RUNNING"
            return m[running]
        except:
            return "unknown"


def sleep_for_net(app):
    blocktimes = {
        12341234: 1,
        30: 12,
        31: 12,
    }
    netid = Config.Get().getBCNetId()
    seconds = blocktimes.get(netid, None)
    if seconds is None:
        app.logger.error("No blocktime for network: %r" % netid)
        seconds = 5
    return seconds
