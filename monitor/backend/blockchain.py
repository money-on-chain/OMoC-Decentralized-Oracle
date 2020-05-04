import asyncio
import logging
import time
from xmlrpc.client import ServerProxy

from config import Config
from moc.moc_oracle import OracleChecker, DecOracleCheker


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
        self.dec_oracle_checker = DecOracleCheker(config.getW3(), config.getOracleManagerAddress())
        self.accountCheckers = {}
        # TODO: Not all accounts must be oracles.
        for account in self.accounts:
            addr = config.getAccountAddress(account)
            self.accountCheckers[account] = OracleChecker(self.dec_oracle_checker, addr)
        self.agent = config.getAgentProgram()
        self.agent_enabled = (config.getAgentProgram() != "")
        if not self.agent_enabled:
            logging.error("No AGENT_PROGRAM specified. Alert disabled.")

    async def checkBlock(self):
        curblock = await self.aw3.getBlock()
        update = self.lastblock != curblock
        if update:
            self.lastblock = curblock
        return update

    async def fetch(self):
        now = time.time()
        self.state["now"] = now
        for account in self.accounts:
            checker = self.accountCheckers[account]
            try:
                self.state[account] = await self.aw3.getBalance(checker.addr)
            except Exception as err:
                logging.error(f"Cannot retrieve account {account} balance. "
                              f"Error: %r" % err)
            await checker.fetch(now)
        self.state["blocknr"] = self.lastblock.number
        if self.agent_enabled:
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
            server = ServerProxy('http://localhost:9001/RPC2')
            info = server.supervisor.getProcessInfo(self.agent)
            if not info or "statename" not in info:
                return "ERROR: invalid response from supervisor"
            return "yes" if info["statename"] == "RUNNING" else "no"
        except Exception as e:
            logging.error("Supervisor connection error: %r" % e)
            return "ERROR: " + str(e)
